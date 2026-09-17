-- thriveABL · 0017 · entry intent + report-link recovery.
-- Idempotent.
--
-- Two things ship here:
--   1. entry_intent — WHY the assessment was started. Anyone may take CAT, but
--      nobody can book a discovery call without one (already enforced by
--      request_booking, 0013). Admin needs to tell the two entry paths apart:
--      "clicked Book a call, was gated into the assessment" vs "just took it".
--   2. report_link_requests — the rate-limit ledger behind the "email me my
--      report link" recovery on the locked booking calendar.

-- ---- 1. entry intent ---------------------------------------------------------
alter table public.assessment_submissions
  add column if not exists entry_intent text not null default 'self_serve';

-- Recorded once, at the moment the run starts, and never updated. It is a
-- record of intent at entry, NOT of what the person later did — whether they
-- went on to book is already answerable from public.bookings.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'assessment_submissions_entry_intent_check'
  ) then
    alter table public.assessment_submissions
      add constraint assessment_submissions_entry_intent_check
      check (entry_intent in ('self_serve','discovery_call'));
  end if;
end $$;

comment on column public.assessment_submissions.entry_intent
  is 'discovery_call = arrived via the gated /book calendar; self_serve = started the assessment directly. Immutable after insert.';

-- Partial index: the admin filter only ever asks for the call-intent slice,
-- which is the minority of rows.
create index if not exists assessment_submissions_intent_idx
  on public.assessment_submissions (submitted_at desc)
  where entry_intent = 'discovery_call';

-- ---- 2. B2B seam (decision #1: B2C now, B2B next) ----------------------------
-- One nullable column so a future team layer needs no backfill on a table that
-- will by then hold real submissions. Deliberately no orgs table: unused
-- machinery rots, and the FK can be added in the same migration that creates it.
alter table public.assessment_submissions
  add column if not exists org_id uuid;

-- ---- 3. report-link recovery ledger ------------------------------------------
-- NOTE: there is deliberately no anon-callable RPC for this. Any function that
-- maps an email to a report token is one bad grant away from leaking every
-- token in the table. The lookup lives in the send-report-link edge function
-- (service_role) instead; this table only exists so that function can rate-limit.
create table if not exists public.report_link_requests (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  ip_hash      text,
  requested_at timestamptz not null default now()
);

create index if not exists report_link_requests_email_idx
  on public.report_link_requests (lower(email), requested_at desc);

create index if not exists report_link_requests_ip_idx
  on public.report_link_requests (ip_hash, requested_at desc);

alter table public.report_link_requests enable row level security;

-- No policies and no grants: service_role bypasses RLS, everyone else is denied
-- by default. If a future migration adds a policy here, that is a bug.
revoke all on public.report_link_requests from anon, authenticated;
