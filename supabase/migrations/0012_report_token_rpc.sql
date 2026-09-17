-- thriveABL · 0012 · public, token-scoped report lookup.
-- The ONLY anon read path into assessment data. Returns exactly what
-- ReportView renders — no gmail, no raw responses, no ip_hash, no delivery
-- status. Key names deliberately match the table's column names so
-- submissionRowToReportData() in src/lib/assessment.js consumes it unchanged.
-- Idempotent.

create or replace function public.get_report_by_token(p_token text)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'submission_id', s.submission_id, 'submitted_at', s.submitted_at,
    'full_name', s.full_name, 'holland_code', s.holland_code,
    'report_source', s.report_source,
    'headline', s.headline, 'tagline', s.tagline,
    'personality_summary', s.personality_summary,
    'career_interest_summary', s.career_interest_summary,
    'values_summary', s.values_summary, 'motivation_summary', s.motivation_summary,
    'integrated_insight', s.integrated_insight, 'development_note', s.development_note,
    'career_matches', s.career_matches, 'key_strengths', s.key_strengths,
    'big_five_scores', s.big_five_scores, 'riasec_scores', s.riasec_scores,
    'top_values', s.top_values, 'top_motivators', s.top_motivators
  )
  from public.assessment_submissions s
  where s.public_token = p_token
    and s.token_revoked_at is null
    and length(p_token) = 32        -- cheap shape guard before the index probe
  limit 1;
$$;

revoke all on function public.get_report_by_token(text) from public;
grant execute on function public.get_report_by_token(text) to anon, authenticated;
