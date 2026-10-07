#!/usr/bin/env node
// Idempotently upsert supabase/seed/skill_courses.json into public.skill_courses
// (on conflict (url)). Safe to re-run: it updates descriptive fields but never
// resets admin-managed fields (active, sort_weight) or link-health columns.
//   node supabase/scripts/seed-courses.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = {}
for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const ref = (env.VITE_SUPABASE_URL || '').replace(/^https:\/\/([a-z0-9]+)\..*$/, '$1')

const courses = JSON.parse(readFileSync(join(root, 'supabase', 'seed', 'skill_courses.json'), 'utf8'))
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
const arr = (a) => `array[${a.map(q).join(',')}]::text[]`

const values = courses.map((c) => `(${[
  q(c.skill_slug), arr(c.subskill_ids), arr(c.levels), q(c.title), q(c.provider), q(c.url), q(c.cost), q(c.format),
  c.duration_hours == null ? 'null' : Number(c.duration_hours), q(c.language || 'en'), q(c.notes || null),
  q(c.verification_method), q(c.final_url || null),
].join(',')})`)

const sql = `
insert into public.skill_courses
  (skill_slug, subskill_ids, levels, title, provider, url, cost, format, duration_hours, language, notes, verification_method, final_url)
values
${values.join(',\n')}
on conflict (url) do update set
  skill_slug = excluded.skill_slug, subskill_ids = excluded.subskill_ids, levels = excluded.levels,
  title = excluded.title, provider = excluded.provider, cost = excluded.cost, format = excluded.format,
  duration_hours = excluded.duration_hours, language = excluded.language, notes = excluded.notes,
  verification_method = excluded.verification_method;
select count(*)::int as total from public.skill_courses;`

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
  body: JSON.stringify({ query: sql }),
})
const body = await res.text()
if (!res.ok) throw new Error(`${res.status} ${body}`)
console.log('seeded', courses.length, 'courses ->', body)
