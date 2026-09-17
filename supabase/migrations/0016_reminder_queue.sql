-- thriveABL · 0016 · day-before reminder queue (automated queueing, manual send).
-- Idempotent.
--
-- Automating the SEND needs the WhatsApp Business API or a paid SMS gateway,
-- neither of which earns its cost at launch volume — so this automates the
-- QUEUE only. A daily job writes notification_outbox rows for tomorrow's
-- confirmed bookings; the admin Bookings screen shows a "Reminders due" list
-- with a one-click prefilled WhatsApp send that marks the row sent. The
-- upgrade path is free: the kit's send-notifications edge function already
-- drains this exact table, so adding an SMS key later makes sending automatic
-- with zero code change.

create extension if not exists pg_cron;

create or replace function public.enqueue_tomorrow_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_outbox (booking_id, event, recipient, to_phone, payload)
  select b.id, 'reminder', 'lead', c.phone,
         jsonb_build_object('name', c.name, 'date', b.date, 'time', b.time, 'email', c.email)
  from public.bookings b
  join public.contacts c on c.id = b.contact_id
  where b.status = 'confirmed'
    and b.date = ((now() at time zone public.kit_timezone())::date + 1)
    and not exists (
      select 1 from public.notification_outbox o
      where o.booking_id = b.id and o.event = 'reminder'
    );
end;
$$;

-- Re-runnable schedule: drop the job by name first so re-applying this
-- migration never errors on "job already exists" or leaves a duplicate.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'thriveabl-daily-reminders') then
    perform cron.unschedule('thriveabl-daily-reminders');
  end if;
end $$;

-- 03:00 UTC = 09:00 Asia/Dhaka
select cron.schedule('thriveabl-daily-reminders', '0 3 * * *', $$select public.enqueue_tomorrow_reminders();$$);
