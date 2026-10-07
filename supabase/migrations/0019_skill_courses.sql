-- thriveABL · 0019 · Course catalog for skill-report recommendations. Idempotent.
--
-- A curated, human-verified list. Courses are NEVER model-generated: every row
-- is a real resource someone opened. Public readers (the report page) may read
-- active, not-known-broken rows only; admins manage everything.

create table if not exists public.skill_courses (
  id                   uuid primary key default gen_random_uuid(),

  -- targeting
  skill_slug           text not null,
  subskill_ids         text[] not null check (cardinality(subskill_ids) >= 1),
  -- LEARNER STARTING levels the resource suits (not the level it leads to)
  levels               text[] not null check (
                         cardinality(levels) >= 1
                         and levels <@ array['emerging','foundational','proficient','advanced']::text[]
                       ),

  -- the resource
  title                text not null,
  provider             text not null,
  url                  text not null unique,
  cost                 text not null check (cost in ('free','free_audit','paid')),
  format               text not null check (format in ('course','video','article','book','coaching')),
  duration_hours       numeric check (duration_hours is null or duration_hours > 0),
  language             text not null default 'en',
  notes                text,

  -- admin
  is_thriveabl         boolean not null default false,
  active               boolean not null default true,
  sort_weight          integer not null default 0,

  -- provenance + link health
  verified_at          timestamptz not null default now(),
  verification_method  text not null default 'page' check (verification_method in ('page','search')),
  last_checked_at      timestamptz,
  last_check_status    integer,
  final_url            text,
  link_state           text not null default 'unknown' check (link_state in ('ok','broken','unknown')),

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Stored-XSS guard: this url is rendered into an href on a PUBLIC page, so a
  -- javascript:/data: value written by a typo or a compromised admin session
  -- would run in every visitor's browser. https only.
  constraint skill_courses_url_https check (url ~ '^https://[^[:space:]]+$'),
  constraint skill_courses_final_url_https check (final_url is null or final_url ~ '^https://[^[:space:]]+$')
);

create index if not exists skill_courses_skill_idx on public.skill_courses (skill_slug, active);
create index if not exists skill_courses_subskills_idx on public.skill_courses using gin (subskill_ids);

drop trigger if exists skill_courses_set_updated_at on public.skill_courses;
create trigger skill_courses_set_updated_at
  before update on public.skill_courses
  for each row execute function public.set_updated_at();

alter table public.skill_courses enable row level security;

revoke all on public.skill_courses from anon, public;
grant select on public.skill_courses to anon, authenticated;
grant insert, update, delete on public.skill_courses to authenticated;
grant all on public.skill_courses to service_role;

-- Public: active rows that are not known-broken. Rows the link checker could not
-- judge ('unknown', e.g. sites that answer bots with 403) stay visible.
drop policy if exists skill_courses_public_read on public.skill_courses;
create policy skill_courses_public_read on public.skill_courses
  for select to anon, authenticated
  using (active and link_state <> 'broken');

-- Admin: everything, including inactive and broken rows.
drop policy if exists skill_courses_admin_all on public.skill_courses;
create policy skill_courses_admin_all on public.skill_courses
  for all to authenticated
  using      (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
