-- Rollback for 0018. Drops ALL skill assessment data. Career Assessment is untouched.
drop function if exists public.get_skill_report_by_token(text);
drop table if exists public.skill_assessment_response_items;
drop table if exists public.skill_assessment_submissions;
