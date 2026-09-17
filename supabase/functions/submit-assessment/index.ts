// thriveABL · submit-assessment
//
// Receives raw Likert responses + name + email. Scores server-side (never
// trusts client-supplied scores — see assessment-core.js validateResponses),
// persists the submission BEFORE calling the LLM (the lead is the asset; the
// network call is what's most likely to fail), returns the report for
// immediate render, then — in the background — renders a PDF, uploads it to
// private Storage, and emails it. Every external dependency degrades to "the
// user still has their report": see the plan's degradation matrix.
//
// Background delivery follows the pattern in
// D:\MIV ALL\Noree jewellery\nore-e-glow\supabase\functions\send-invoice\index.ts:
// ack fast, do the slow work in EdgeRuntime.waitUntil, never throw from a
// delivery helper.

import {
  RESPONSE_ITEM_META,
  BF_LABELS,
  RI_LABELS,
  validateResponses,
  computeScores,
  buildFallbackReport,
  pct,
} from '../_shared/assessment-core.js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type Report = {
  headline: string
  tagline: string
  personalitySummary: string
  careerInterestSummary: string
  valuesSummary: string
  motivationSummary: string
  integratedInsight: string
  developmentNote: string
  careerMatches: string[]
  keyStrengths: string[]
}

type Scores = {
  bf: Record<string, number>
  ri: Record<string, number>
  wv: Record<string, number>
  mv: Record<string, number>
  hollandCode: string
  topValues: string[]
  topMotivators: string[]
}

type SubmitBody = {
  version?: number
  responses?: Record<string, number>
  fullName?: string
  email?: string
  consent?: boolean
  turnstileToken?: string
  /** Why this run was started. Anything unrecognised falls back to self_serve. */
  intent?: string
  meta?: unknown
}

type DeliveryContext = {
  submissionId: string
  publicToken: string
  report: Report
  scores: Scores
  name: string
  email: string
  reportUrl: string
  bookingUrl: string
}

// ============================================================
// HTTP plumbing
// ============================================================

function corsHeaders(origin: string): Record<string, string> {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const allowOrigin = allowed.length === 0 || allowed.includes(origin) ? (origin || '*') : allowed[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return fwd ? fwd.split(',')[0].trim() : 'unknown'
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ))
}

function scheduleBackground(promise: Promise<unknown>): void {
  const rt = (globalThis as Record<string, unknown>).EdgeRuntime as
    | { waitUntil?: (p: Promise<unknown>) => void }
    | undefined
  if (rt?.waitUntil) rt.waitUntil(promise)
  else promise.catch((err) => console.error('submit-assessment: background task failed', err))
}

// ============================================================
// PostgREST (service role — never exposed to the browser)
// ============================================================

async function sbFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  })
}

async function countSince(column: string, value: string, sinceIso: string): Promise<number> {
  const res = await sbFetch(
    `/assessment_submissions?select=id&${column}=eq.${encodeURIComponent(value)}&created_at=gt.${encodeURIComponent(sinceIso)}`,
    { method: 'GET', headers: { Prefer: 'count=exact', Range: '0-0' } },
  )
  const range = res.headers.get('content-range')
  if (!range) return 0
  const total = range.split('/')[1]
  return total === '*' || !total ? 0 : parseInt(total, 10)
}

async function insertSubmission(args: {
  submissionId: string
  submittedAt: string
  fullName: string
  email: string
  ipHash: string
  responses: Record<string, number>
  scores: Scores
  fallback: Report
  consent: boolean
  entryIntent: string
}): Promise<{ publicToken: string } | null> {
  const { submissionId, submittedAt, fullName, email, ipHash, responses, scores, fallback, consent, entryIntent } = args

  const row = {
    submission_id: submissionId,
    submitted_at: submittedAt,
    full_name: fullName,
    gmail: email,
    holland_code: scores.hollandCode,
    report_source: 'fallback',
    headline: fallback.headline,
    tagline: fallback.tagline,
    personality_summary: fallback.personalitySummary,
    career_interest_summary: fallback.careerInterestSummary,
    values_summary: fallback.valuesSummary,
    motivation_summary: fallback.motivationSummary,
    integrated_insight: fallback.integratedInsight,
    development_note: fallback.developmentNote,
    career_matches: fallback.careerMatches,
    key_strengths: fallback.keyStrengths,
    big_five_scores: scores.bf,
    riasec_scores: scores.ri,
    top_values: scores.topValues,
    top_motivators: scores.topMotivators,
    responses,
    response_items: RESPONSE_ITEM_META.map((item) => ({ ...item, value: responses[item.id] })),
    ip_hash: ipHash,
    consent_at: consent ? submittedAt : null,
    entry_intent: entryIntent,
  }

  const res = await sbFetch('/assessment_submissions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  })
  if (!res.ok) {
    console.error('submit-assessment: insertSubmission failed', await res.text().catch(() => ''))
    return null
  }
  const data = await res.json()
  const inserted = Array.isArray(data) ? data[0] : data
  if (!inserted?.public_token) return null

  // Child rows are best-effort — the parent's `responses` jsonb is already the
  // full source of truth, so a failure here is logged, not fatal.
  const itemRows = RESPONSE_ITEM_META.map((item) => ({
    submission_id: submissionId,
    submitted_at: submittedAt,
    full_name: fullName,
    gmail: email,
    question_id: item.id,
    section_id: item.sectionId,
    section_label: item.sectionLabel,
    section_title: item.sectionTitle,
    question_order: item.questionOrder,
    prompt: item.prompt,
    value: responses[item.id],
  }))
  const itemsRes = await sbFetch('/assessment_response_items', { method: 'POST', body: JSON.stringify(itemRows) })
  if (!itemsRes.ok) console.error('submit-assessment: insert response_items failed', await itemsRes.text().catch(() => ''))

  return { publicToken: inserted.public_token as string }
}

async function updateNarrative(submissionId: string, report: Report, latencyMs: number): Promise<void> {
  const patch = {
    report_source: 'ai',
    headline: report.headline,
    tagline: report.tagline,
    personality_summary: report.personalitySummary,
    career_interest_summary: report.careerInterestSummary,
    values_summary: report.valuesSummary,
    motivation_summary: report.motivationSummary,
    integrated_insight: report.integratedInsight,
    development_note: report.developmentNote,
    career_matches: report.careerMatches,
    key_strengths: report.keyStrengths,
    llm_model: Deno.env.get('OPENROUTER_MODEL') || 'google/gemini-2.0-flash-001',
    llm_latency_ms: latencyMs,
  }
  const res = await sbFetch(`/assessment_submissions?submission_id=eq.${submissionId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  if (!res.ok) console.error('submit-assessment: updateNarrative failed', await res.text().catch(() => ''))
}

async function markDelivery(submissionId: string, patch: Record<string, unknown>): Promise<void> {
  const res = await sbFetch(`/assessment_submissions?submission_id=eq.${submissionId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  if (!res.ok) console.error('submit-assessment: markDelivery failed', await res.text().catch(() => ''))
}

// ============================================================
// Abuse gates
// ============================================================

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET')
  if (!secret) return true // not configured -> skipped (dev / until enabled)
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const data = await res.json()
    return !!data.success
  } catch {
    return true // fail OPEN — a real lead beats a blocked one on a network hiccup
  }
}

// ============================================================
// OpenRouter — never throws; null means "use the fallback"
// ============================================================

function buildPrompt(scores: Scores): string {
  const { bf, ri, wv, mv, hollandCode, topValues, topMotivators } = scores
  return `You are a senior career psychologist. Return ONLY valid JSON, no markdown, no backticks, no preamble.
Big Five (0-100%): ${Object.entries(bf).map(([k, v]) => `${BF_LABELS[k]}=${pct(v)}%`).join(', ')}
RIASEC (0-100%): ${Object.entries(ri).map(([k, v]) => `${RI_LABELS[k]}=${pct(v)}%`).join(', ')}
Top Holland Code: ${hollandCode}
Work Values (1-5): ${Object.entries(wv).map(([k, v]) => `${k}=${v.toFixed(1)}`).join(', ')}
Top Values: ${topValues.join(', ')}
Motivation (1-5): ${Object.entries(mv).map(([k, v]) => `${k}=${v.toFixed(1)}`).join(', ')}
Top Motivators: ${topMotivators.join(', ')}
Return exactly: {"headline":"3-4 word career identity label","tagline":"One evocative sentence","personalitySummary":"2-3 sentences on Big Five","careerInterestSummary":"2-3 sentences on RIASEC","valuesSummary":"1-2 sentences","motivationSummary":"1-2 sentences","integratedInsight":"3-4 sentences synthesising all four dimensions","careerMatches":["role 1","role 2","role 3","role 4","role 5"],"keyStrengths":["strength 1","strength 2","strength 3"],"developmentNote":"1-2 sentences on growth edge"}`
}

// Strict whitelist + length caps — the model's only input is 34 numbers today,
// but escaping/capping stays load-bearing the moment a free-text question is
// ever added, and that's exactly when it'd otherwise be forgotten.
function parseReportJson(raw: string): Report | null {
  const cleaned = raw.replace(/```json|```/gi, '').trim()
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const first = cleaned.indexOf('{')
    const last = cleaned.lastIndexOf('}')
    if (first === -1 || last === -1 || last <= first) return null
    try {
      parsed = JSON.parse(cleaned.slice(first, last + 1))
    } catch {
      return null
    }
  }

  const report: Partial<Report> = {}
  const textKeys: (keyof Report)[] = [
    'headline', 'tagline', 'personalitySummary', 'careerInterestSummary',
    'valuesSummary', 'motivationSummary', 'integratedInsight', 'developmentNote',
  ]
  for (const key of textKeys) {
    const value = parsed[key]
    if (typeof value !== 'string' || !value.trim()) return null
    report[key] = value.slice(0, key === 'headline' ? 80 : 800) as never
  }
  for (const key of ['careerMatches', 'keyStrengths'] as const) {
    const value = parsed[key]
    if (!Array.isArray(value) || value.length === 0) return null
    report[key] = value.slice(0, 8).map((v) => String(v).slice(0, 120)) as never
  }
  return report as Report
}

async function tryGenerateNarrative(scores: Scores, timeoutMs: number): Promise<Report | null> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) return null
  const model = Deno.env.get('OPENROUTER_MODEL') || 'google/gemini-2.0-flash-001'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a senior career psychologist. Respond with a single valid JSON object and nothing else — no markdown, no code fences, no preamble.' },
          { role: 'user', content: buildPrompt(scores) },
        ],
        temperature: 0.75,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) {
      console.error('submit-assessment: OpenRouter returned', res.status, await res.text().catch(() => ''))
      return null
    }
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) return null
    return parseReportJson(text)
  } catch (err) {
    clearTimeout(timer)
    console.error('submit-assessment: OpenRouter request failed', err)
    return null
  }
}

// ============================================================
// Delivery (background) — PDFShift + Resend, never throws.
// Two separate templates, deliberately: the PDF targets headless Chrome at
// A4; the email targets Gmail/Outlook and must carry the full report inline
// (not just "see attachment"), per the send-invoice precedent.
// ============================================================

function scoreRows(scores: Record<string, number>, labels: Record<string, string>): string {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => {
      const percent = pct(value)
      return `<tr>
        <td style="padding:4px 0;font-size:13px;">${escapeHtml(labels[key] ?? key)}</td>
        <td style="padding:4px 0;font-size:13px;font-family:monospace;text-align:right;">${percent}%</td>
      </tr>`
    })
    .join('')
}

function buildReportPdfHtml(ctx: DeliveryContext): string {
  const { report, scores, name } = ctx
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { size: A4; margin: 24mm 20mm; }
  body { font-family: Helvetica, Arial, sans-serif; color: #0A0A0A; font-size: 12px; line-height: 1.5; }
  h1 { font-size: 22px; font-weight: 500; margin-bottom: 4px; }
  .tagline { font-style: italic; color: #3D3D3D; margin-bottom: 16px; }
  .holland { font-family: monospace; letter-spacing: 4px; font-size: 16px; margin-bottom: 24px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; border-bottom: 1px solid #0A0A0A; padding-bottom: 4px; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  ul { margin: 4px 0 0 16px; padding: 0; }
</style></head>
<body>
  <p style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#767676;">thriveABL &mdash; Career Identity Report</p>
  <h1>${escapeHtml(report.headline)}</h1>
  <p class="tagline">${escapeHtml(report.tagline)}</p>
  <p class="holland">HOLLAND CODE ${escapeHtml(scores.hollandCode)}</p>
  <p>Prepared for ${escapeHtml(name)}.</p>

  <h2>01 &middot; Big Five Personality</h2>
  <table>${scoreRows(scores.bf, BF_LABELS)}</table>
  <p>${escapeHtml(report.personalitySummary)}</p>

  <h2>02 &middot; RIASEC Career Interests</h2>
  <table>${scoreRows(scores.ri, RI_LABELS)}</table>
  <p>${escapeHtml(report.careerInterestSummary)}</p>

  <h2>Work Values</h2>
  <ul>${scores.topValues.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>
  <p>${escapeHtml(report.valuesSummary)}</p>

  <h2>Motivation</h2>
  <ul>${scores.topMotivators.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>
  <p>${escapeHtml(report.motivationSummary)}</p>

  <h2>Integrated Portrait</h2>
  <p>${escapeHtml(report.integratedInsight)}</p>

  <h2>Suggested Career Directions</h2>
  <ul>${report.careerMatches.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>

  <h2>Key Strengths</h2>
  <ul>${report.keyStrengths.map((v) => `<li>${escapeHtml(v)}</li>`).join('')}</ul>

  <h2>Growth Edge</h2>
  <p>${escapeHtml(report.developmentNote)}</p>
</body></html>`
}

function buildReportEmailHtml(ctx: DeliveryContext, hasPdf: boolean): string {
  const { report, scores, name, reportUrl, bookingUrl } = ctx
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0A0A0A;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#767676;">thriveABL</p>
    <h1 style="font-size:20px;font-weight:500;margin:8px 0 4px;">${escapeHtml(report.headline)}</h1>
    <p style="font-style:italic;color:#3D3D3D;margin:0 0 16px;">${escapeHtml(report.tagline)}</p>
    <p style="font-family:monospace;letter-spacing:3px;margin:0 0 20px;">HOLLAND CODE ${escapeHtml(scores.hollandCode)}</p>
    <p style="font-size:14px;line-height:1.6;">Hi ${escapeHtml(name)}, your career identity report is ready.</p>
    <p style="font-size:14px;line-height:1.6;">${escapeHtml(report.integratedInsight)}</p>
    <p style="margin:24px 0;">
      <a href="${reportUrl}" style="display:inline-block;background:#0A0A0A;color:#FFFFFF;text-decoration:none;padding:12px 20px;font-size:14px;">View your full report</a>
    </p>
    ${hasPdf ? '<p style="font-size:13px;color:#3D3D3D;">A PDF copy is attached.</p>' : ''}
    <p style="font-size:14px;line-height:1.6;margin-top:20px;">Completing the assessment has unlocked priority booking for a free 30-minute Discovery Call.</p>
    <p style="margin:16px 0;">
      <a href="${bookingUrl}" style="display:inline-block;border:1px solid #0A0A0A;color:#0A0A0A;text-decoration:none;padding:12px 20px;font-size:14px;">Book your free call</a>
    </p>
  </div>`
}

async function tryRenderPdf(html: string): Promise<Uint8Array | null> {
  const apiKey = Deno.env.get('PDFSHIFT_API_KEY')
  if (!apiKey) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const res = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Basic ${btoa(`api:${apiKey}`)}` },
      body: JSON.stringify({ source: html, format: 'A4' }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) {
      console.error('submit-assessment: PDFShift returned', res.status, await res.text().catch(() => ''))
      return null
    }
    return new Uint8Array(await res.arrayBuffer())
  } catch (err) {
    clearTimeout(timer)
    console.error('submit-assessment: PDFShift request failed', err)
    return null
  }
}

async function uploadPdf(submissionId: string, bytes: Uint8Array): Promise<string | null> {
  const path = `${submissionId}.pdf`
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/reports/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/pdf',
      'x-upsert': 'true',
    },
    body: bytes,
  })
  if (!res.ok) {
    console.error('submit-assessment: PDF upload failed', await res.text().catch(() => ''))
    return null
  }
  return path
}

async function trySendEmail(
  ctx: DeliveryContext,
  pdfBase64: string | null,
): Promise<{ status: 'sent' | 'failed'; error?: string; resendId?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return { status: 'failed', error: 'RESEND_API_KEY not set' }

  const fromEmail = Deno.env.get('FROM_EMAIL') || 'thriveABL <onboarding@resend.dev>'
  const coachEmail = Deno.env.get('COACH_EMAIL')

  const body: Record<string, unknown> = {
    from: fromEmail,
    to: [ctx.email],
    subject: `Your Career Identity Report — ${ctx.report.headline}`,
    html: buildReportEmailHtml(ctx, !!pdfBase64),
  }
  if (coachEmail) body.bcc = [coachEmail]
  if (pdfBase64) {
    body.attachments = [{ filename: `thriveABL-Report-${ctx.scores.hollandCode}.pdf`, content: pdfBase64 }]
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { status: 'failed', error: `Resend ${res.status}: ${detail}` }
    }
    const data = await res.json().catch(() => null) as { id?: string } | null
    return { status: 'sent', resendId: data?.id }
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) }
  }
}

async function deliver(ctx: DeliveryContext): Promise<void> {
  const pdfBytes = await tryRenderPdf(buildReportPdfHtml(ctx))
  let pdfBase64: string | null = null

  if (pdfBytes) {
    const path = await uploadPdf(ctx.submissionId, pdfBytes)
    if (path) {
      pdfBase64 = bytesToBase64(pdfBytes)
      await markDelivery(ctx.submissionId, { pdf_status: 'rendered', pdf_path: path })
    } else {
      await markDelivery(ctx.submissionId, { pdf_status: 'failed', pdf_error: 'storage upload failed' })
    }
  } else {
    const configured = !!Deno.env.get('PDFSHIFT_API_KEY')
    await markDelivery(ctx.submissionId, {
      pdf_status: configured ? 'failed' : 'skipped',
      pdf_error: configured ? 'PDFShift render failed' : null,
    })
  }

  const emailResult = await trySendEmail(ctx, pdfBase64)
  if (emailResult.status === 'sent') {
    await markDelivery(ctx.submissionId, { email_status: 'sent', delivered_at: new Date().toISOString() })
  } else {
    await markDelivery(ctx.submissionId, { email_status: 'failed', email_error: emailResult.error })
  }
}

// ============================================================
// Entry point
// ============================================================

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin') ?? ''
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return json({ ok: false, code: 'method_not_allowed' }, 405, origin)

  const raw = await req.text()
  if (raw.length > 32 * 1024) return json({ ok: false, code: 'invalid_body' }, 400, origin)

  let body: SubmitBody
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ ok: false, code: 'invalid_body' }, 400, origin)
  }
  if (!body || typeof body !== 'object' || !body.responses || typeof body.responses !== 'object') {
    return json({ ok: false, code: 'invalid_body' }, 400, origin)
  }

  const fullName = String(body.fullName ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return json({ ok: false, code: 'invalid_name' }, 400, origin)
  }
  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, code: 'invalid_email' }, 400, origin)
  }

  const validation = validateResponses(body.responses)
  if (!validation.ok) {
    return json({ ok: false, code: 'incomplete_responses', ...validation }, 422, origin)
  }

  // Abuse gates — with the pre-assessment email gate gone, anyone who finishes
  // 34 taps now triggers a billable LLM call, so this is load-bearing, not optional.
  const ip = clientIp(req)
  const ipHash = await hashIp(ip, Deno.env.get('IP_HASH_SALT') ?? '')

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return json({ ok: false, code: 'captcha_failed' }, 403, origin)
  }

  const ipCount = await countSince('ip_hash', ipHash, new Date(Date.now() - 60 * 60 * 1000).toISOString())
  if (ipCount >= 5) return json({ ok: false, code: 'rate_limited', retryAfterSeconds: 3600 }, 429, origin)

  const emailCount = await countSince('gmail', email, new Date(Date.now() - 10 * 60 * 1000).toISOString())
  if (emailCount >= 2) return json({ ok: false, code: 'rate_limited', retryAfterSeconds: 600 }, 429, origin)

  // Score server-side. The client scorers default a missing answer to a
  // neutral value, which yields a plausible but fabricated profile — this is
  // why validation above rejects incomplete payloads before we ever get here.
  const scores = computeScores(body.responses) as Scores
  const fallback = buildFallbackReport(scores) as Report

  // Allow-list, not passthrough: the column has a CHECK constraint (0017) and
  // an unrecognised value would fail the insert, losing a completed assessment
  // over a query-string typo.
  const entryIntent = body.intent === 'discovery_call' ? 'discovery_call' : 'self_serve'

  const submissionId = crypto.randomUUID()
  const submittedAt = new Date().toISOString()
  const inserted = await insertSubmission({
    submissionId, submittedAt, fullName, email, ipHash,
    responses: body.responses, scores, fallback, consent: !!body.consent,
    entryIntent,
  })
  if (!inserted) return json({ ok: false, code: 'persist_failed' }, 500, origin)

  const timeoutMs = parseInt(Deno.env.get('LLM_TIMEOUT_MS') ?? '25000', 10)
  const startedAt = Date.now()
  const ai = await tryGenerateNarrative(scores, timeoutMs)
  if (ai) await updateNarrative(submissionId, ai, Date.now() - startedAt)

  const report = ai ?? fallback
  const reportSource = ai ? 'ai' : 'fallback'

  const siteOrigin = Deno.env.get('PUBLIC_SITE_ORIGIN') ?? ''
  const reportUrl = `${siteOrigin}/r/${inserted.publicToken}`
  const bookingUrl = `${siteOrigin}/book?r=${inserted.publicToken}`

  scheduleBackground(deliver({
    submissionId, publicToken: inserted.publicToken, report, scores,
    name: fullName, email, reportUrl, bookingUrl,
  }))

  return json({
    ok: true,
    submissionId,
    reportToken: inserted.publicToken,
    reportUrl,
    bookingUrl,
    reportSource,
    report,
    scores: {
      bf: scores.bf, ri: scores.ri, hollandCode: scores.hollandCode,
      topValues: scores.topValues, topMotivators: scores.topMotivators,
    },
    delivery: { email: 'queued' },
  }, 200, origin)
})
