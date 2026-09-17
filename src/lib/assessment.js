// Re-export shim over the shared scoring core (also consumed by the
// submit-assessment edge function in Deno) plus UI-only helpers that have no
// business running server-side. Never re-implement scoring here — see
// supabase/functions/_shared/assessment-core.js.
export {
  SECTIONS,
  BF_LABELS,
  RI_LABELS,
  RESPONSE_ITEM_META,
  average,
  scoreBigFive,
  scoreRIASEC,
  scoreValues,
  scoreMotivation,
  getTop,
  pct,
  validateResponses,
  computeScores,
  buildFallbackReport,
  microInsightForSection,
} from '../../supabase/functions/_shared/assessment-core.js'

// Maps a saved assessment_submissions row (snake_case columns) into the shape
// ReportView consumes, so the admin detail view and the public /r/:token page
// (which gets the same key names from get_report_by_token) both render the
// exact report the taker saw, from already-stored data.
export function submissionRowToReportData(row) {
  return {
    parsed: {
      headline: row.headline,
      tagline: row.tagline,
      personalitySummary: row.personality_summary,
      careerInterestSummary: row.career_interest_summary,
      valuesSummary: row.values_summary,
      motivationSummary: row.motivation_summary,
      integratedInsight: row.integrated_insight,
      developmentNote: row.development_note,
      careerMatches: Array.isArray(row.career_matches) ? row.career_matches : [],
      keyStrengths: Array.isArray(row.key_strengths) ? row.key_strengths : [],
    },
    bf: row.big_five_scores || {},
    ri: row.riasec_scores || {},
    top3R: row.holland_code || '',
    topVals: Array.isArray(row.top_values) ? row.top_values : [],
    topMot: Array.isArray(row.top_motivators) ? row.top_motivators : [],
    source: row.report_source || 'ai',
    reportToken: row.public_token,
  }
}

// Maps the submit-assessment edge function's JSON response into the same
// shape, so ReportView needs no knowledge of the API's wire format.
export function apiResultToReportData(apiResult) {
  const { report, scores, reportSource, reportToken } = apiResult
  return {
    parsed: report,
    bf: scores.bf,
    ri: scores.ri,
    top3R: scores.hollandCode,
    topVals: scores.topValues,
    topMot: scores.topMotivators,
    source: reportSource,
    reportToken,
  }
}
