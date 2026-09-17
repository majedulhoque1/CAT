-- thriveABL · 0010 · retire admins/is_admin(); user_roles + has_role() becomes
-- the only admin gate. Idempotent — safe whether or not CAT's legacy
-- supabase-admin.sql was ever applied to this project.
--
-- Why: is_admin() keyed authorization on a mutable, hand-seeded email with no
-- lower(), and only guarded 4 policies. has_role() keys on an immutable
-- auth.users uuid and already guards ~14 policies + RPCs across the kit.

-- 1. Carry the legacy email allowlist over, matching case-insensitively.
--    to_regclass guard => no-op on a project that never had CAT's table.
do $$
declare v_legacy_rows int := 0;
begin
  if to_regclass('public.admins') is not null then
    select count(*) into v_legacy_rows from public.admins;

    insert into public.user_roles (user_id, role)
    select u.id, 'admin'::public.app_role
    from public.admins a
    join auth.users u on lower(u.email) = lower(trim(a.email))
    on conflict (user_id, role) do nothing;

    -- 2. Safety gate: never drop the old gate if the new one is empty on a DB
    --    that HAD admins. (A seeded email with no auth.users row lands here —
    --    create the Supabase Auth user, then re-run this migration.)
    if v_legacy_rows > 0
       and not exists (select 1 from public.user_roles where role = 'admin') then
      raise exception
        'Refusing to drop legacy admin gate: public.admins has % row(s) but none '
        'matched an auth.users email. Create the auth user(s) first, then re-run 0010.',
        v_legacy_rows;
    end if;
  end if;
end $$;

-- back-fill profiles for any admin that predates the kit's handle_new_user trigger
insert into public.profiles (id, email, display_name)
select u.id, u.email, split_part(u.email, '@', 1)
from auth.users u
where exists (
  select 1 from public.user_roles r where r.user_id = u.id and r.role = 'admin'
)
on conflict (id) do nothing;

-- 3. Rewrite the four CAT policies that referenced is_admin() into two
--    "for all" policies bound to has_role (admins also get UPDATE now: token
--    revocation, delivery-status resets, CRM notes).
drop policy if exists "admin_select_submissions"    on public.assessment_submissions;
drop policy if exists "admin_delete_submissions"    on public.assessment_submissions;
drop policy if exists "admin_select_response_items" on public.assessment_response_items;
drop policy if exists "admin_delete_response_items" on public.assessment_response_items;

drop policy if exists assessment_submissions_admin_all on public.assessment_submissions;
create policy assessment_submissions_admin_all on public.assessment_submissions
  for all to authenticated
  using      (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists assessment_response_items_admin_all on public.assessment_response_items;
create policy assessment_response_items_admin_all on public.assessment_response_items
  for all to authenticated
  using      (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 4. Drop the legacy gate. Deliberately NO CASCADE — if any policy anywhere
--    still references is_admin(), this fails loudly instead of silently
--    unsecuring a table.
drop function if exists public.is_admin();
drop table    if exists public.admins;
