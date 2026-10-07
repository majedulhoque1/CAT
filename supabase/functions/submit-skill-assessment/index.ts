// thriveABL · submit-skill-assessment
//
// Receives option choices + self-ratings + name/email for ONE skill. Scores
// server-side against answer keys that never leave this function (the browser
// bundle contains only the public question bank). Persists the submission and
// per-item rows, then returns the scored result for immediate render.
//
// Deliberately a sibling of submit-assessment, not a refactor of it: the Career
// Assessment function is live and this change must not be able to break it.
// The HTTP plumbing below is copied; consolidating it is tracked tech debt.

import {
  validateSkillResponses,
  scoreSkill,
  itemOutcomes,
} from '../_shared/skill-core.js'
import { getSkillMeta } from '../_shared/skills/registry.js'
import dataLiteracyBank from '../_shared/skills/data-literacy.bank.js'
import dataLiteracyKeys from '../_shared/skills/data-literacy.keys.js'
import workplaceCommunicationBank from '../_shared/skills/workplace-communication.bank.js'
import workplaceCommunicationKeys from '../_shared/skills/workplace-communication.keys.js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

// slug -> bank + keys. A new skill is one import pair and one line here.
const SKILLS: Record<string, { bank: any; keys: any }> = {
  'data-literacy': { bank: dataLiteracyBank, keys: dataLiteracyKeys },
  'workplace-communication': { bank: workplaceCommunicationBank, keys: workplaceCommunicationKeys },
}

type SubmitBody = {
  skill?: string
  bankVersion?: number
  responses?: Record<string, string>
  selfRatings?: Record<string, number>
  timings?: Record<string, number>
  fullName?: string
  email?: string
  consent?: boolean
  startedAt?: string
  turnstileToken?: string
}

// ============================================================
// HTTP plumbing
// ============================================================

// This project's own Vercel addresses (production alias, branch previews and
// per-deployment URLs). Only the Vercel team that owns the project can create
// hostnames in this shape, so the pattern stays narrow.
const PROJECT_ORIGINS = [
  /^https:\/\/cat1(-[a-z0-9-]+)?-majedul-hoque-shakils-projects\.vercel\.app$/,
  /^https:\/\/cat1-blush\.vercel\.app$/,
]

function corsHeaders(origin: string): Record<string, string> {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const trusted = allowed.length === 0 || allowed.includes(origin) || PROJECT_ORIGINS.some((re) => re.test(origin))
  const allowOrigin = trusted ? (origin || '*') : allowed[0]
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

async function countRows(filter: string): Promise<number> {
  const res = await sbFetch(`/skill_assessment_submissions?select=id&${filter}`, {
    method: 'GET',
    headers: { Prefer: 'count=exact', Range: '0-0' },
  })
  const range = res.headers.get('content-range')
  if (!range) return 0
  const total = range.split('/')[1]
  return total === '*' || !total ? 0 : parseInt(total, 10)
}

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET')
  if (!secret) return true
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
    return true // fail open, a real person beats a blocked one on a network hiccup
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

  const slug = String(body.skill ?? '')
  const entry = Object.prototype.hasOwnProperty.call(SKILLS, slug) ? SKILLS[slug] : null
  if (!entry || !getSkillMeta(slug)) return json({ ok: false, code: 'unknown_skill' }, 404, origin)
  const { bank, keys } = entry

  // A browser holding an older cached bank must not be scored against newer keys.
  if (body.bankVersion !== bank.version) {
    return json({ ok: false, code: 'bank_version_mismatch', currentVersion: bank.version }, 409, origin)
  }

  const fullName = String(body.fullName ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  if (fullName.length < 2 || fullName.length > 120) return json({ ok: false, code: 'invalid_name' }, 400, origin)
  if (!EMAIL_RE.test(email)) return json({ ok: false, code: 'invalid_email' }, 400, origin)

  const validation = validateSkillResponses(bank, { responses: body.responses, selfRatings: body.selfRatings })
  if (!validation.ok) return json({ ok: false, code: 'incomplete_responses', ...validation }, 422, origin)

  const ip = clientIp(req)
  const ipHash = await hashIp(ip, Deno.env.get('IP_HASH_SALT') ?? '')

  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return json({ ok: false, code: 'captcha_failed' }, 403, origin)
  }

  const hourAgo = encodeURIComponent(new Date(Date.now() - 60 * 60 * 1000).toISOString())
  const dayAgo = encodeURIComponent(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  if ((await countRows(`ip_hash=eq.${encodeURIComponent(ipHash)}&created_at=gt.${hourAgo}`)) >= 5) {
    return json({ ok: false, code: 'rate_limited', retryAfterSeconds: 3600 }, 429, origin)
  }
  const emailQ = encodeURIComponent(email)
  const skillQ = encodeURIComponent(slug)
  if ((await countRows(`email=eq.${emailQ}&skill_slug=eq.${skillQ}&created_at=gt.${dayAgo}`)) >= 3) {
    return json({ ok: false, code: 'rate_limited', retryAfterSeconds: 86400 }, 429, origin)
  }
  const attemptNo = (await countRows(`email=eq.${emailQ}&skill_slug=eq.${skillQ}`)) + 1

  // Score. `result` carries no answer keys; per-item correctness is kept in a
  // separate admin-only table.
  const result = scoreSkill(bank, keys, body.responses, body.selfRatings, body.timings)
  const outcomes = itemOutcomes(bank, keys, body.responses, body.timings)

  const submissionId = crypto.randomUUID()
  const startedAt = body.startedAt && !Number.isNaN(Date.parse(body.startedAt)) ? new Date(body.startedAt).toISOString() : null

  const insertRes = await sbFetch('/skill_assessment_submissions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      submission_id: submissionId,
      skill_slug: slug,
      bank_version: bank.version,
      attempt_no: attemptNo,
      full_name: fullName,
      email,
      consent_at: body.consent ? new Date().toISOString() : null,
      started_at: startedAt,
      level: result.level,
      level_label: result.levelLabel,
      total_correct: result.totalCorrect,
      total_items: result.totalItems,
      consistency: result.consistency,
      low_effort: result.lowEffort,
      self_ratings: body.selfRatings,
      responses: body.responses,
      result,
      ip_hash: ipHash,
    }),
  })
  if (!insertRes.ok) {
    console.error('submit-skill-assessment: insert failed', await insertRes.text().catch(() => ''))
    return json({ ok: false, code: 'persist_failed' }, 500, origin)
  }
  const inserted = await insertRes.json()
  const row = Array.isArray(inserted) ? inserted[0] : inserted
  if (!row?.public_token) return json({ ok: false, code: 'persist_failed' }, 500, origin)

  // Child rows are best-effort; the parent's `responses` jsonb is the source of truth.
  const itemsRes = await sbFetch('/skill_assessment_response_items', {
    method: 'POST',
    body: JSON.stringify(outcomes.map((o: any) => ({
      submission_id: submissionId,
      skill_slug: slug,
      bank_version: bank.version,
      item_id: o.itemId,
      subskill: o.subskill,
      tier: o.tier,
      option_id: o.optionId,
      correct_option_id: o.correctOptionId,
      correct: o.correct,
      ms: o.ms,
    }))),
  })
  if (!itemsRes.ok) console.error('submit-skill-assessment: item insert failed', await itemsRes.text().catch(() => ''))

  const siteOrigin = Deno.env.get('PUBLIC_SITE_ORIGIN') ?? ''
  return json({
    ok: true,
    submissionId,
    reportToken: row.public_token,
    reportUrl: `${siteOrigin}/s/${row.public_token}`,
    attemptNo,
    result,
  }, 200, origin)
})
