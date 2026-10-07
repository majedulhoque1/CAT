// Validates supabase/seed/skill_courses.json against the skill registry.
// Run: node supabase/seed/skill_courses.test.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { listSkills } from '../functions/_shared/skills/registry.js'

const here = dirname(fileURLToPath(import.meta.url))
const courses = JSON.parse(readFileSync(join(here, 'skill_courses.json'), 'utf8'))
const LEVELS = ['emerging', 'foundational', 'proficient', 'advanced']
const MIN_PER_CELL = 3

const skills = listSkills()
const subsBySkill = new Map(skills.map((s) => [s.slug, new Set(s.subskills.map((x) => x.id))]))

const urls = new Set()
for (const c of courses) {
  const where = `${c.title} (${c.url})`
  assert.ok(subsBySkill.has(c.skill_slug), `unknown skill_slug: ${where}`)
  assert.ok(c.subskill_ids.length >= 1, `no subskills: ${where}`)
  for (const s of c.subskill_ids) assert.ok(subsBySkill.get(c.skill_slug).has(s), `subskill ${s} not in ${c.skill_slug}: ${where}`)
  assert.ok(c.levels.length >= 1 && c.levels.every((l) => LEVELS.includes(l)), `bad levels: ${where}`)
  assert.match(c.url, /^https:\/\/\S+$/, `url must be https: ${where}`)
  assert.ok(!/[?&](utm_|fbclid|gclid)/i.test(c.url), `tracking parameters in url: ${where}`)
  assert.ok(['free', 'free_audit', 'paid'].includes(c.cost), `bad cost: ${where}`)
  assert.ok(['course', 'video', 'article', 'book', 'coaching'].includes(c.format), `bad format: ${where}`)
  assert.ok(['page', 'search'].includes(c.verification_method), `bad verification_method: ${where}`)
  assert.ok(c.title && c.provider, `missing title/provider: ${where}`)
  assert.ok(!urls.has(c.url), `duplicate url: ${c.url}`)
  urls.add(c.url)
}

// Coverage: every (subskill x level) cell has at least MIN_PER_CELL courses.
const gaps = []
for (const s of skills) {
  for (const sub of s.subskills) {
    for (const level of LEVELS) {
      const n = courses.filter((c) => c.skill_slug === s.slug && c.subskill_ids.includes(sub.id) && c.levels.includes(level)).length
      if (n < MIN_PER_CELL) gaps.push(`${sub.id}/${level}=${n}`)
    }
  }
}
assert.deepEqual(gaps, [], `coverage gaps (need >= ${MIN_PER_CELL} per cell): ${gaps.join(', ')}`)

console.log(`skill_courses seed ok: ${courses.length} courses, all ${skills.length * 4 * 4} cells >= ${MIN_PER_CELL}`)
