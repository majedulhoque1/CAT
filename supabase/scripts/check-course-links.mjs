#!/usr/bin/env node
// Link checker for the skill_courses catalog.
//
//   node supabase/scripts/check-course-links.mjs            dry run over supabase/seed/skill_courses.json
//   node supabase/scripts/check-course-links.mjs --db       check the rows currently in the database
//   ... --apply                                             write link_state / status back to the database
//
// States: broken (404/410, DNS or TLS failure), ok (2xx on the expected page),
// unknown (401/403/429/5xx, timeouts, or a redirect to a generic landing page).
// Many large course sites answer bots with 403/429, so those stay "unknown" for
// a human to open, they are never treated as broken. Never deletes rows.
//
// DB access uses the Supabase Management API with SUPABASE_ACCESS_TOKEN from .env,
// the same mechanism used to apply migrations.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const args = new Set(process.argv.slice(2))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function loadEnv() {
  const env = {}
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* no .env */ }
  return env
}
const env = loadEnv()
const REF = (env.VITE_SUPABASE_URL || '').replace(/^https:\/\/([a-z0-9]+)\..*$/, '$1')

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({ query }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`SQL failed: ${JSON.stringify(body)}`)
  return body
}

function isGenericLanding(requested, finalUrl) {
  try {
    const a = new URL(requested)
    const b = new URL(finalUrl)
    const bp = b.pathname.replace(/\/+$/, '')
    if (bp === '' || /^\/(search|catalog|browse|courses|explore)$/i.test(bp)) return a.pathname.replace(/\/+$/, '') !== bp
    return false
  } catch { return false }
}

async function check(url) {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 10000)
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/pdf,*/*' } })
    const status = res.status
    const finalUrl = res.url || url
    try { await res.body?.cancel() } catch { /* ignore */ }
    let state = 'unknown'
    if (status === 404 || status === 410) state = 'broken'
    else if (status >= 200 && status < 300) state = isGenericLanding(url, finalUrl) ? 'unknown' : 'ok'
    return { status, finalUrl, state }
  } catch (err) {
    const code = err?.cause?.code || err?.code || ''
    // Only a DNS failure is real evidence the site is gone. Certificate-chain
    // errors are common in Node for sites whose chain browsers complete on their
    // own (incomplete intermediates), so they stay "unknown" for a human to open.
    const state = /ENOTFOUND/i.test(String(code)) ? 'broken' : 'unknown'
    return { status: 0, finalUrl: url, state, error: String(code || err?.name || err) }
  } finally {
    clearTimeout(timer)
  }
}

async function pool(items, worker, size = 6) {
  const out = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await worker(items[idx])
    }
  }))
  return out
}

let courses
if (args.has('--db')) {
  courses = await sql('select url, title from public.skill_courses order by url')
} else {
  courses = JSON.parse(readFileSync(join(root, 'supabase', 'seed', 'skill_courses.json'), 'utf8'))
}

const results = await pool(courses, async (c) => ({ url: c.url, title: c.title, ...(await check(c.url)) }))

const tally = { ok: 0, broken: 0, unknown: 0 }
for (const r of results) tally[r.state] += 1
console.log(`checked ${results.length}:`, tally)
for (const r of results.filter((x) => x.state !== 'ok')) {
  console.log(`  ${r.state.toUpperCase().padEnd(8)} ${String(r.status).padEnd(4)} ${r.title.slice(0, 50).padEnd(50)} ${r.url}${r.finalUrl !== r.url ? ` -> ${r.finalUrl}` : ''}${r.error ? ` [${r.error}]` : ''}`)
}
writeFileSync(join(root, 'supabase', 'seed', '.link-check-latest.json'), JSON.stringify(results, null, 2))

if (args.has('--apply')) {
  // One statement, not one per row: the Management API throttles bursts.
  const esc = (s) => String(s).replace(/'/g, "''")
  const rows = results.map((r) => `('${esc(r.url)}','${r.state}',${r.status || 'null'},'${esc(r.finalUrl)}')`).join(',\n')
  await sql(`update public.skill_courses c
    set link_state = v.state, last_check_status = v.status, final_url = v.final_url, last_checked_at = now()
    from (values ${rows}) as v(url, state, status, final_url)
    where c.url = v.url`)
  console.log('applied to database')
}
