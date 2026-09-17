-- thriveABL · 0014 · runtime config + availability seed.
-- Supersedes contract/seed.sql — do not apply that file separately.
-- Idempotent.

-- timezone is load-bearing for every RPC's date math => FORCED on every apply.
-- 0002 and seed.sql both use "do nothing", so this is the only thing that can
-- move an already-seeded project off 'UTC'. A 6-hour skew silently corrupts
-- every slot calculation (get_available_slots / request_booking / get_slot_summary).
insert into public.site_settings (key, value) values ('timezone', 'Asia/Dhaka')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Operator-editable via the admin Settings screen => seeded ONCE, never clobbered.
insert into public.site_settings (key, value) values
  ('notify_staff_phone',      ''),
  ('brand_name',              'thriveABL'),
  ('site_origin',             'https://thriveabl.com'),
  ('discovery_call_minutes',  '30'),
  ('coach_email',             ''),
  ('coach_whatsapp',          '')
on conflict (key) do nothing;

-- Sun-Thu 10:00-18:00, 30-minute slots (80/week — placeholder until the real
-- weekly ceiling is confirmed; see the plan's open items). Guard runs the swap
-- exactly once and never clobbers hours the coach later edits from admin.
do $$
begin
  if not exists (select 1 from public.availability where slot_minutes = 30) then
    delete from public.availability where slot_minutes = 60;   -- kit defaults, if ever seeded
    insert into public.availability (weekday, start_time, end_time, slot_minutes, active)
    select d.w, '10:00'::time, '18:00'::time, 30, true
    from (values (0),(1),(2),(3),(4)) as d(w);                 -- 0=Sun … 4=Thu
  end if;
end $$;
