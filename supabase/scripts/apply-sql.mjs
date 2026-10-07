#!/usr/bin/env node
// Apply a SQL file to the Supabase project through the Management API
// (the Supabase CLI is unusable on this machine). Usage:
//   node supabase/scripts/apply-sql.mjs supabase/migrations/0018_skill_assessments.sql [...more files]
// Reads SUPABASE_ACCESS_TOKEN and VITE_SUPABASE_URL from .env. Reloads the
// PostgREST schema cache afterwards so new tables/functions are reachable.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = {}
for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const ref = (env.VITE_SUPABASE_URL || '').replace(/^https:\/\/([a-z0-9]+)\..*$/, '$1')
if (!ref || !env.SUPABASE_ACCESS_TOKEN) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_ACCESS_TOKEN in .env')

async function run(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${text}`)
  return text
}

const files = process.argv.slice(2)
if (!files.length) throw new Error('Pass at least one .sql file')
for (const f of files) {
  const sql = readFileSync(resolve(f), 'utf8')
  await run(sql)
  console.log('applied', f)
}
await run("notify pgrst, 'reload schema'")
console.log('schema cache reload requested')
