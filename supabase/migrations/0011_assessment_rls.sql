-- thriveABL · 0011 · assessment RLS lockdown. Idempotent.
--
-- The view fix below was already applied by hand to the LIVE project on
-- 2026-07-26 to close a public PII leak: assessment_responses_readable ran as
-- its owner (ignoring RLS) and Supabase's default privileges had granted it to
-- anon, so any holder of the publishable key could read every participant's
-- name, email, Holland code and all 34 answers. This migration captures that
-- fix so a fresh `supabase db reset` / new environment matches production,
-- plus closes the anon-INSERT hole on the base tables.

-- ---- 1. the PII leak: the view ---------------------------------------------
drop view if exists public.assessment_responses_readable;
create view public.assessment_responses_readable
with (security_invoker = true) as
select
  s.submission_id, s.submitted_at, s.full_name, s.gmail, s.holland_code,
  s.headline, s.report_source,
  i.section_label, i.section_title, i.question_order, i.question_id, i.prompt, i.value
from public.assessment_response_items i
join public.assessment_submissions s on s.submission_id = i.submission_id
order by s.submitted_at desc, i.section_label asc, i.question_order asc;

revoke all on public.assessment_responses_readable from anon, public;
grant select on public.assessment_responses_readable to authenticated;

-- ---- 2. the anon INSERT hole ------------------------------------------------
drop policy if exists "public_insert_assessment_submissions"    on public.assessment_submissions;
drop policy if exists "public_insert_assessment_response_items" on public.assessment_response_items;

-- Belt and braces: a policy with no GRANT is dead, and a GRANT with no policy
-- is dead. Remove both so neither can be resurrected by a partial re-run.
revoke all on public.assessment_submissions    from anon, public;
revoke all on public.assessment_response_items from anon, public;

-- ---- 3. RLS stays on; admin (0010) + service_role get what they need -------
alter table public.assessment_submissions    enable row level security;
alter table public.assessment_response_items enable row level security;

grant select, insert, update, delete on public.assessment_submissions    to authenticated;
grant select, insert, update, delete on public.assessment_response_items to authenticated;
grant all on public.assessment_submissions    to service_role;
grant all on public.assessment_response_items to service_role;
