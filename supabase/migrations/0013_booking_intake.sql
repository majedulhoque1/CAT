-- thriveABL · 0013 · discovery-call booking intake (token-gated) + slot summary.
-- Idempotent.
--
-- Replaces the kit's reference request_booking signature — MUST drop first,
-- since a different argument list would create an overload and PostgREST would
-- then 300 on an ambiguous rpc call.
drop function if exists public.request_booking(text, text, int, text, text, date, time, text);

-- The report token IS the priority-booking pass: unique, unguessable, only
-- minted on a completed assessment (0009/0012). No promo-code table needed —
-- a client can never attach someone else's Holland code to a booking because
-- the assessment is resolved server-side from the token, never from input.
create or replace function public.request_booking(
  p_name         text,
  p_email        text,
  p_phone        text,
  p_report_token text,
  p_slot_date    date,
  p_slot_time    time,
  p_note         text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_now     timestamp := (now() at time zone public.kit_timezone());
  v_sub     public.assessment_submissions%rowtype;
  v_details jsonb;
  v_contact uuid;
  v_booking uuid;
  v_ok      boolean;
begin
  -- 1. input
  if p_name is null or length(trim(p_name)) = 0 or length(p_name) > 120
     or p_email is null or p_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('status','invalid_input');
  end if;

  -- 2. the priority pass: a valid, unrevoked report token is required
  if p_report_token is null or length(p_report_token) <> 32 then
    return jsonb_build_object('status','invalid_token');
  end if;

  select * into v_sub from public.assessment_submissions
   where public_token = p_report_token and token_revoked_at is null;

  if v_sub.id is null then
    return jsonb_build_object('status','invalid_token');
  end if;

  -- 3. future slot, client timezone (Asia/Dhaka via site_settings, 0014)
  if p_slot_date < v_now::date
     or (p_slot_date = v_now::date and p_slot_time <= v_now::time) then
    return jsonb_build_object('status','invalid_slot');
  end if;

  -- 4. slot inside an active availability window
  select exists (select 1 from public.availability a
                 where a.active and a.weekday = extract(dow from p_slot_date)::int
                   and p_slot_time >= a.start_time and p_slot_time < a.end_time)
    into v_ok;
  if not v_ok then return jsonb_build_object('status','invalid_slot'); end if;

  -- 5. rate limit: 3 bookings per email per 24h
  if (select count(*) from public.bookings b join public.contacts c on c.id = b.contact_id
      where lower(c.email) = lower(p_email) and b.created_at > now() - interval '24 hours') >= 3
  then return jsonb_build_object('status','rate_limited'); end if;

  -- 6. one active booking per token — the pass is single-use while pending/confirmed
  if exists (
    select 1 from public.bookings b
    where b.details ->> 'report_token' = p_report_token
      and b.status in ('pending','confirmed')
  ) then
    return jsonb_build_object('status','already_booked');
  end if;

  -- 7. snapshot the profile into details jsonb — no join needed to read it later,
  --    and it stays fixed at booking time even if the candidate retakes the CAT.
  v_details := jsonb_strip_nulls(jsonb_build_object(
    'source',          'career_assessment',
    'booking_type',    'discovery_call_30',
    'submission_id',   v_sub.submission_id,
    'report_token',    v_sub.public_token,
    'report_url',      (select value from public.site_settings where key = 'site_origin')
                        || '/r/' || v_sub.public_token,
    'holland_code',    v_sub.holland_code,
    'headline',        v_sub.headline,
    'top_values',      v_sub.top_values,
    'top_motivators',  v_sub.top_motivators,
    'note',            nullif(trim(coalesce(p_note,'')),'')
  ));

  -- 8. find-or-create the contact, deduped by email
  select id into v_contact from public.contacts
   where lower(email) = lower(p_email) order by created_at limit 1;

  if v_contact is null then
    insert into public.contacts (name, email, phone, details, source_submission_id)
    values (trim(p_name), lower(p_email), nullif(trim(coalesce(p_phone,'')),''),
            v_details, v_sub.id)
    returning id into v_contact;
  else
    update public.contacts
       set name    = coalesce(nullif(trim(p_name),''), name),
           phone    = coalesce(nullif(trim(coalesce(p_phone,'')),''), phone),
           details  = details || v_details,
           source_submission_id = coalesce(v_sub.id, source_submission_id)
     where id = v_contact;
  end if;

  -- 9. book; the partial unique index (0004) is the final race guard
  begin
    insert into public.bookings (contact_id, date, time, status, source, details)
    values (v_contact, p_slot_date, p_slot_time, 'pending', 'assessment_funnel', v_details)
    returning id into v_booking;
  exception when unique_violation then
    return jsonb_build_object('status','slot_taken');
  end;

  return jsonb_build_object('status','ok','booking_id', v_booking);
end $$;

grant execute on function public.request_booking(text,text,text,text,date,time,text)
  to anon, authenticated;

-- Identity-free capacity signal for the "N of M Discovery Calls left" line.
-- Rolling 7-day window from now (not calendar week) so it never reads "0 of N"
-- on a Friday just because the new week hasn't started. get_available_slots
-- already excludes booked slots, so total capacity = free + already-booked.
create or replace function public.get_slot_summary()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_now       timestamp := (now() at time zone public.kit_timezone());
  v_from      date := v_now::date;
  v_to        date := v_now::date + 6;
  v_free      int;
  v_booked    int;
begin
  select count(*) into v_free
  from public.get_available_slots(v_from, v_to);

  select count(*) into v_booked
  from public.bookings b
  where b.date between v_from and v_to
    and b.status in ('pending','confirmed');

  return jsonb_build_object(
    'capacity',  v_free + v_booked,
    'booked',    v_booked,
    'remaining', v_free
  );
end $$;

grant execute on function public.get_slot_summary() to anon, authenticated;
