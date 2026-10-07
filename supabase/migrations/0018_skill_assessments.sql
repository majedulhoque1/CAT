-- thriveABL · 0018 · Skill Assessment submissions. Idempotent and purely additive:
-- it touches no Career Assessment table, function or policy.
--
-- Skill results live in their own tables on purpose. assessment_submissions
-- means "completed the Career Assessment" and its token is what unlocks
-- request_booking (0013). Putting skill rows in that table would let a skill
-- result unlock a discovery call.
--
-- Answer keys never reach the database's public surface: the `result` snapshot
-- is built without them, and correct_option_id sits only in the admin-only
-- response-items table.

create extension if not exists pgcrypto;

-- ---- 1. submissions ----------------------------------------------------------
create table if not exists public.skill_assessment_submissions (
  id             uuid primary key default gen_random_uuid(),
  submission_id  text not null unique,
  skill_slug     text not null,
  bank_version   integer not null,
  attempt_no     integer not null default 1 check (attempt_no >= 1),
  full_name      text not null,
  email          text not null,
  consent_at     timestamptz,
  started_at     timestamptz,

  level          text not null check (level in ('emerging','foundational','proficient','advanced')),
  level_label    text not null,
  total_correct  integer not null check (total_correct >= 0),
  total_items    integer not null check (total_items > 0),
  consistency    text not null check (consistency in ('consistent','mixed')),
  low_effort     boolean not null default false,

  self_ratings   jsonb not null default '{}'::jsonb,
  responses      jsonb not null default '{}'::jsonb,
  -- Full scored snapshot, so a report stays stable if the bank text is edited later.
  result         jsonb not null default '{}'::jsonb,

  public_token     text not null unique default encode(gen_random_bytes(16), 'hex'),
  token_revoked_at timestamptz,
  ip_hash          text,
  created_at       timestamptz not null default now()
);

create index if not exists skill_submissions_ip_idx
  on public.skill_assessment_submissions (ip_hash, created_at desc);
create index if not exists skill_submissions_email_idx
  on public.skill_assessment_submissions (lower(email), skill_slug, created_at desc);
create index if not exists skill_submissions_created_idx
  on public.skill_assessment_submissions (created_at desc);

-- ---- 2. per-item responses (calibration data + admin detail) -------------------
create table if not exists public.skill_assessment_response_items (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      text not null references public.skill_assessment_submissions(submission_id) on delete cascade,
  skill_slug         text not null,
  bank_version       integer not null,
  item_id            text not null,
  subskill           text not null,
  tier               text not null check (tier in ('F','W','A')),
  option_id          text not null,
  correct_option_id  text not null,
  correct            boolean not null,
  ms                 integer check (ms is null or ms >= 0),
  created_at         timestamptz not null default now()
);

create index if not exists skill_items_submission_idx
  on public.skill_assessment_response_items (submission_id);
create index if not exists skill_items_stats_idx
  on public.skill_assessment_response_items (skill_slug, bank_version, item_id);

-- ---- 3. access: nothing public, admins and service_role only -------------------
alter table public.skill_assessment_submissions    enable row level security;
alter table public.skill_assessment_response_items enable row level security;

revoke all on public.skill_assessment_submissions    from anon, public;
revoke all on public.skill_assessment_response_items from anon, public;

drop policy if exists skill_submissions_admin_all on public.skill_assessment_submissions;
create policy skill_submissions_admin_all on public.skill_assessment_submissions
  for all to authenticated
  using      (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists skill_items_admin_all on public.skill_assessment_response_items;
create policy skill_items_admin_all on public.skill_assessment_response_items
  for all to authenticated
  using      (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

grant select, insert, update, delete on public.skill_assessment_submissions    to authenticated;
grant select, insert, update, delete on public.skill_assessment_response_items to authenticated;
grant all on public.skill_assessment_submissions    to service_role;
grant all on public.skill_assessment_response_items to service_role;

-- ---- 4. the ONLY anon read path: a token-scoped report ---------------------------
-- Returns the scored snapshot and the first name only. No email, no raw
-- responses, no ip_hash, no answer keys.
create or replace function public.get_skill_report_by_token(p_token text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'submission_id', s.submission_id,
    'skill_slug',    s.skill_slug,
    'bank_version',  s.bank_version,
    'attempt_no',    s.attempt_no,
    'first_name',    split_part(s.full_name, ' ', 1),
    'level',         s.level,
    'level_label',   s.level_label,
    'created_at',    s.created_at,
    'result',        s.result
  )
  from public.skill_assessment_submissions s
  where s.public_token = p_token
    and s.token_revoked_at is null
    and length(p_token) = 32
  limit 1;
$$;

revoke all on function public.get_skill_report_by_token(text) from public;
grant execute on function public.get_skill_report_by_token(text) to anon, authenticated;
