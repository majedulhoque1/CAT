create extension if not exists pgcrypto;

create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_id text not null unique,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  holland_code text,
  report_source text,
  headline text,
  tagline text,
  personality_summary text,
  career_interest_summary text,
  values_summary text,
  motivation_summary text,
  integrated_insight text,
  development_note text,
  career_matches jsonb not null default '[]'::jsonb,
  key_strengths jsonb not null default '[]'::jsonb,
  big_five_scores jsonb not null default '{}'::jsonb,
  riasec_scores jsonb not null default '{}'::jsonb,
  top_values jsonb not null default '[]'::jsonb,
  top_motivators jsonb not null default '[]'::jsonb,
  responses jsonb not null default '{}'::jsonb,
  response_items jsonb not null default '[]'::jsonb
);

create table if not exists public.assessment_response_items (
  id uuid primary key default gen_random_uuid(),
  submission_id text not null references public.assessment_submissions(submission_id) on delete cascade,
  submitted_at timestamptz not null default now(),
  question_id text not null,
  section_id text,
  section_label text,
  section_title text,
  question_order integer,
  prompt text,
  value integer
);

alter table public.assessment_response_items
  add column if not exists section_label text,
  add column if not exists question_order integer;

alter table public.assessment_submissions enable row level security;
alter table public.assessment_response_items enable row level security;

grant usage on schema public to anon, authenticated;
grant insert on table public.assessment_submissions to anon, authenticated;
grant insert on table public.assessment_response_items to anon, authenticated;

drop policy if exists "public_insert_assessment_submissions" on public.assessment_submissions;
create policy "public_insert_assessment_submissions"
on public.assessment_submissions
for insert
to public
with check (true);

drop policy if exists "public_insert_assessment_response_items" on public.assessment_response_items;
create policy "public_insert_assessment_response_items"
on public.assessment_response_items
for insert
to public
with check (true);

create or replace view public.assessment_responses_readable as
select
  s.submission_id,
  s.submitted_at,
  s.holland_code,
  s.headline,
  s.report_source,
  i.section_label,
  i.section_title,
  i.question_order,
  i.question_id,
  i.prompt,
  i.value
from public.assessment_response_items i
join public.assessment_submissions s
  on s.submission_id = i.submission_id
order by s.submitted_at desc, i.section_label asc, i.question_order asc;
