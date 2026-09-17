-- thriveABL · 0015 · private storage bucket for rendered report PDFs.
-- Idempotent. Deny-all to anon/authenticated: every access to this bucket is
-- via a server-generated signed URL (service_role bypasses RLS entirely), so
-- no storage.objects policy is needed — same shape as analytics_events (0004/0008).
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;
