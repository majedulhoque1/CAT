// thriveABL · send-report-link
//
// Recovery path for the locked booking calendar: someone assessed weeks ago on
// another device, lost the email, and now wants to book. They give an address;
// if we hold a report for it, we re-send the link.
//
// SECURITY — the two rules this function exists to enforce:
//   1. The response is IDENTICAL whether or not the address is in the database.
//      A different status, a different shape, or a different latency would turn
//      this into an oracle for "has this person taken the assessment", which is
//      health-adjacent personal data.
//   2. The report token never crosses the network to the caller. It only ever
//      goes to the mailbox that owns it.
//
// This is deliberately NOT a Postgres RPC: an anon-callable function that maps
// an email to a token is one careless `grant execute` away from leaking every
// token in the table. Service-role only, here, where the grant cannot slip.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const MAX_PER_EMAIL_PER_DAY = 3
const MAX_PER_IP_PER_HOUR = 8

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

async function countRequestsSince(column: string, value: string, sinceIso: string): Promise<number> {
  const res = await sbFetch(
    `/report_link_requests?select=id&${column}=eq.${encodeURIComponent(value)}&requested_at=gt.${encodeURIComponent(sinceIso)}`,
    { headers: { Prefer: 'count=exact', Range: '0-0' } },
  )
  const range = res.headers.get('content-range')
  const total = range?.split('/')?.[1]
  return total ? parseInt(total, 10) : 0
}

type SubmissionRow = {
  public_token: string
  full_name: string | null
  headline: string | null
  submitted_at: string
}

async function findLatestReport(email: string): Promise<SubmissionRow | null> {
  const res = await sbFetch(
    `/assessment_submissions?select=public_token,full_name,headline,submitted_at` +
      `&gmail=eq.${encodeURIComponent(email)}` +
      `&token_revoked_at=is.null` +
      `&order=submitted_at.desc&limit=1`,
  )
  if (!res.ok) {
    console.error('send-report-link: lookup failed', await res.text().catch(() => ''))
    return null
  }
  const rows = await res.json().catch(() => null) as SubmissionRow[] | null
  return rows?.[0] ?? null
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

function buildEmailHtml(row: SubmissionRow, reportUrl: string, bookingUrl: string): string {
  const name = row.full_name ? escapeHtml(row.full_name) : 'there'
  const taken = new Date(row.submitted_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#0A0A0A;">
    <p style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#767676;">thriveABL</p>
    <h1 style="font-size:20px;font-weight:500;margin:8px 0 16px;">Here is your report link</h1>
    <p style="font-size:14px;line-height:1.6;">Hi ${name}, you asked us to re-send the link to the Career Identity Report you completed on ${escapeHtml(taken)}.</p>
    ${row.headline ? `<p style="font-size:14px;line-height:1.6;font-style:italic;color:#3D3D3D;">${escapeHtml(row.headline)}</p>` : ''}
    <p style="margin:24px 0;">
      <a href="${reportUrl}" style="display:inline-block;background:#0A0A0A;color:#FFFFFF;text-decoration:none;padding:12px 20px;font-size:14px;">View your report</a>
    </p>
    <p style="font-size:14px;line-height:1.6;">This link also unlocks booking for a free 30-minute Discovery Call.</p>
    <p style="margin:16px 0;">
      <a href="${bookingUrl}" style="display:inline-block;border:1px solid #0A0A0A;color:#0A0A0A;text-decoration:none;padding:12px 20px;font-size:14px;">Book your free call</a>
    </p>
    <p style="font-size:12px;color:#767676;margin-top:24px;">If you did not request this, you can ignore this email — the link was not shared with anyone else.</p>
  </div>`
}

async function sendEmail(to: string, html: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('send-report-link: RESEND_API_KEY not set — nothing sent')
    return
  }
  const fromEmail = Deno.env.get('FROM_EMAIL') || 'thriveABL <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: 'Your thriveABL report link',
        html,
      }),
    })
    if (!res.ok) {
      console.error('send-report-link: Resend returned', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.error('send-report-link: Resend request failed', err)
  }
}

function scheduleBackground(p: Promise<unknown>): void {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime
  if (runtime?.waitUntil) runtime.waitUntil(p)
  else void p
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin') ?? ''
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return json({ ok: false, code: 'method_not_allowed' }, 405, origin)

  // The single response every caller gets, in every branch below except a
  // malformed request. Declared once so no future edit can accidentally make
  // the "found" and "not found" paths distinguishable.
  const ACK = { ok: true, message: 'If we have a report for that address, the link is on its way.' }

  const raw = await req.text()
  if (raw.length > 2 * 1024) return json({ ok: false, code: 'invalid_body' }, 400, origin)

  let body: { email?: string }
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ ok: false, code: 'invalid_body' }, 400, origin)
  }

  const email = String(body?.email ?? '').trim().toLowerCase()
  // A malformed address is a client bug, not an enumeration signal — safe to
  // report honestly, because it says nothing about who is in the database.
  if (!EMAIL_RE.test(email)) return json({ ok: false, code: 'invalid_email' }, 400, origin)

  const ipHash = await hashIp(clientIp(req), Deno.env.get('IP_HASH_SALT') ?? '')

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [byIp, byEmail] = await Promise.all([
    countRequestsSince('ip_hash', ipHash, hourAgo),
    countRequestsSince('email', email, dayAgo),
  ])

  // Rate-limited callers get the ACK too. A 429 here would tell an attacker
  // their probing was "working" and let them time the difference.
  if (byIp >= MAX_PER_IP_PER_HOUR || byEmail >= MAX_PER_EMAIL_PER_DAY) {
    return json(ACK, 200, origin)
  }

  await sbFetch('/report_link_requests', {
    method: 'POST',
    body: JSON.stringify({ email, ip_hash: ipHash }),
  })

  // Everything from here runs in the background: the lookup and the send must
  // not change how long the caller waits, or response time becomes the oracle.
  scheduleBackground((async () => {
    const row = await findLatestReport(email)
    if (!row) return
    const siteOrigin = Deno.env.get('PUBLIC_SITE_ORIGIN') ?? ''
    const reportUrl = `${siteOrigin}/r/${row.public_token}`
    const bookingUrl = `${siteOrigin}/book?r=${row.public_token}`
    await sendEmail(email, buildEmailHtml(row, reportUrl, bookingUrl))
  })())

  return json(ACK, 200, origin)
})
