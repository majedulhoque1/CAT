#!/usr/bin/env node
// Deploy an edge function through the Supabase Management API (the CLI is
// unusable on this machine). Uploads the function folder plus every file it
// imports from ../_shared, keeping relative paths so `../_shared/...` imports
// resolve.
//   node supabase/scripts/deploy-function.mjs submit-skill-assessment [--verify-jwt=true|false]
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, sep } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const fnRoot = join(root, 'supabase', 'functions')
const slug = process.argv[2]
if (!slug) throw new Error('Usage: deploy-function.mjs <function-slug> [--verify-jwt=true|false]')
const verifyArg = process.argv.find((a) => a.startsWith('--verify-jwt='))
const verifyJwt = verifyArg ? verifyArg.split('=')[1] !== 'false' : true

const env = {}
for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const ref = (env.VITE_SUPABASE_URL || '').replace(/^https:\/\/([a-z0-9]+)\..*$/, '$1')

// Only runtime files: skip tests, fixtures and the Deno test.
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return walk(p)
    if (/\.(test|fixture)\./.test(name) || /\.deno\.test\./.test(name)) return []
    return /\.(ts|js|json)$/.test(name) ? [p] : []
  })
}
const files = [...walk(join(fnRoot, slug)), ...walk(join(fnRoot, '_shared'))]

const form = new FormData()
form.append('metadata', JSON.stringify({
  name: slug,
  entrypoint_path: `${slug}/index.ts`,
  verify_jwt: verifyJwt,
}))
for (const f of files) {
  const rel = relative(fnRoot, f).split(sep).join('/')
  form.append('file', new Blob([readFileSync(f)], { type: 'application/octet-stream' }), rel)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/functions/deploy?slug=${encodeURIComponent(slug)}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'User-Agent': 'Mozilla/5.0' },
  body: form,
})
const text = await res.text()
console.log(res.status, text.slice(0, 400))
if (!res.ok) process.exit(1)
console.log(`deployed ${slug} (${files.length} files, verify_jwt=${verifyJwt})`)
