// Backfill for the "every report suggests the same professions" defect.
//
// buildFallbackReport used to return one hardcoded five-role list to every
// taker, and that list is what gets written at INSERT time — before OpenRouter
// is called — so any submission whose LLM call did not land kept it forever.
// Fixing the scoring core only changes new submissions; this rescores the rows
// already in the table from their own stored `responses` jsonb.
//
// Only touches rows with report_source = 'fallback'. AI-written narratives are
// left alone: their prose refers to their own role list, so swapping the list
// underneath would leave the two contradicting each other.
//
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://<ref>.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service role key>"
//   node supabase/scripts/backfill-career-matches.mjs --dry-run
//   node supabase/scripts/backfill-career-matches.mjs --apply
//
// The service role key bypasses RLS — run it locally, never ship it to a client.

import { computeScores, validateResponses, buildFallbackReport } from '../functions/_shared/assessment-core.js'

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const APPLY = process.argv.includes('--apply')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.')
  process.exit(1)
}
if (!APPLY && !process.argv.includes('--dry-run')) {
  console.error('Pass --dry-run to preview, or --apply to write.')
  process.exit(1)
}

async function sb(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => '')}`)
  return res
}

const select = 'submission_id,report_source,responses,career_matches,headline'
const rows = await (await sb(`/assessment_submissions?select=${select}&report_source=eq.fallback&order=created_at.asc`)).json()

console.log(`${rows.length} fallback row(s) to consider.\n`)

let updated = 0
let skipped = 0

for (const row of rows) {
  const validation = validateResponses(row.responses)
  if (!validation.ok) {
    // An incomplete row cannot be rescored honestly — a neutral default would
    // fabricate a profile, which is the whole reason validateResponses exists.
    console.log(`SKIP ${row.submission_id} — responses incomplete (${validation.missing.length} missing)`)
    skipped += 1
    continue
  }

  const scores = computeScores(row.responses)
  const report = buildFallbackReport(scores)

  const before = Array.isArray(row.career_matches) ? row.career_matches.join(', ') : '—'
  console.log(`${row.submission_id}  [${scores.hollandCode}]`)
  console.log(`  was: ${before}`)
  console.log(`  now: ${report.careerMatches.join(', ')}`)

  if (APPLY) {
    await sb(`/assessment_submissions?submission_id=eq.${row.submission_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        headline: report.headline,
        tagline: report.tagline,
        integrated_insight: report.integratedInsight,
        development_note: report.developmentNote,
        career_matches: report.careerMatches,
        key_strengths: report.keyStrengths,
      }),
    })
    updated += 1
  }
  console.log('')
}

console.log(APPLY ? `Done — ${updated} row(s) rescored, ${skipped} skipped.` : `Dry run — ${rows.length - skipped} row(s) would be rescored, ${skipped} skipped.`)
