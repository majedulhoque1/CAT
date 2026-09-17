-- thriveABL · 0009 · assessment tables (ported from CAT's supabase-schema.sql)
-- Anon grants/policies deliberately omitted here — writes go through the
-- submit-assessment edge function (service_role); see 0011 for the RLS lockdown.
-- Idempotent.

create extension if not exists pgcrypto;

create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_id text not null unique,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  full_name text,
  gmail text,
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

comment on column public.assessment_submissions.gmail
  is 'participant email address, any domain (legacy column name — kept to avoid churning the admin CSV export)';

create table if not exists public.assessment_response_items (
  id uuid primary key default gen_random_uuid(),
  submission_id text not null references public.assessment_submissions(submission_id) on delete cascade,
  submitted_at timestamptz not null default now(),
  full_name text,
  gmail text,
  question_id text not null,
  section_id text,
  section_label text,
  section_title text,
  question_order integer,
  prompt text,
  value integer
);

-- ---- Thriveabl delta columns ------------------------------------------------
alter table public.assessment_submissions
  add column if not exists public_token      text,
  add column if not exists token_revoked_at  timestamptz,
  add column if not exists ip_hash           text,
  add column if not exists email_status      text not null default 'pending',
  add column if not exists email_error       text,
  add column if not exists pdf_status        text not null default 'pending',
  add column if not exists pdf_error         text,
  add column if not exists pdf_path          text,
  add column if not exists consent_at        timestamptz,
  add column if not exists llm_model         text,
  add column if not exists llm_latency_ms    integer,
  add column if not exists straightline_flag boolean not null default false;

-- back-fill + enforce the token on every row (32 hex chars = 128 bits)
update public.assessment_submissions
   set public_token = encode(gen_random_bytes(16), 'hex')
 where public_token is null;

alter table public.assessment_submissions
  alter column public_token set default encode(gen_random_bytes(16), 'hex');

create unique index if not exists assessment_submissions_public_token_key
  on public.assessment_submissions (public_token);

create index if not exists assessment_submissions_ip_hash_idx
  on public.assessment_submissions (ip_hash, created_at desc);

create index if not exists assessment_submissions_email_idx
  on public.assessment_submissions (lower(gmail), created_at desc);

alter table public.assessment_submissions    enable row level security;
alter table public.assessment_response_items enable row level security;
