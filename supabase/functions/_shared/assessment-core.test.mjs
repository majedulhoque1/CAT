// Node-side half of the cross-runtime drift guard for assessment-core.js.
// Run: node supabase/functions/_shared/assessment-core.test.mjs
// The Deno-side equivalent is assessment-core.deno.test.ts — both assert the
// same fixture so a change that only touches one runtime's copy is caught.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validateResponses, computeScores, buildFallbackReport, SECTIONS } from './assessment-core.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = JSON.parse(readFileSync(join(here, 'assessment-core.fixture.json'), 'utf8'))

const validation = validateResponses(fixture.responses)
assert.equal(validation.ok, fixture.expected.validationOk, 'validateResponses.ok mismatch')

const scores = computeScores(fixture.responses)
assert.deepEqual(scores, fixture.expected.scores, 'computeScores output mismatch')

const fallback = buildFallbackReport(scores)
assert.equal(fallback.headline, fixture.expected.fallbackHeadline, 'buildFallbackReport headline mismatch')
assert.deepEqual(fallback.careerMatches, fixture.expected.fallbackCareerMatches, 'buildFallbackReport careerMatches mismatch')

// Regression guard. The fallback used to return one hardcoded five-role list to
// every taker, so every report shipped identical career suggestions. These
// assertions fail the moment the deterministic report stops discriminating.
const ITEM_IDS = SECTIONS.flatMap((section) => section.items.map((item) => item.id))
const profile = (overrides) => {
  const responses = {}
  ITEM_IDS.forEach((id) => { responses[id] = 3 })
  return Object.assign(responses, overrides)
}

const archetypes = {
  // One deliberately strong profile per RIASEC theme.
  realistic: profile({ R1: 5, R2: 5, CV1: 4, CV2: 4, AA1: 1, AA2: 1, S1: 1, S2: 1, EN1: 2, C1: 5, C2: 1 }),
  investigative: profile({ I1: 5, I2: 5, R1: 4, R2: 4, AA1: 2, S1: 1, S2: 1, EN1: 1, O1: 5, O2: 1 }),
  artistic: profile({ AA1: 5, AA2: 5, O1: 5, O2: 1, R1: 1, R2: 1, CV1: 1, CV2: 1, S1: 2, EN1: 2 }),
  social: profile({ S1: 5, S2: 5, A1: 5, A2: 1, R1: 1, R2: 1, I1: 2, I2: 2, EN1: 2, CV1: 2 }),
  enterprising: profile({ EN1: 5, EN2: 5, S1: 4, S2: 4, E1: 5, E2: 1, R1: 1, AA1: 2, I1: 2, CV1: 3 }),
  conventional: profile({ CV1: 5, CV2: 5, I1: 4, AA1: 1, AA2: 1, R1: 2, EN1: 2, C1: 5, C2: 1, E1: 2 }),
}

const matchesByArchetype = {}
for (const [name, responses] of Object.entries(archetypes)) {
  const report = buildFallbackReport(computeScores(responses))
  assert.equal(report.careerMatches.length, 5, `${name}: expected 5 career matches`)
  assert.equal(new Set(report.careerMatches).size, 5, `${name}: career matches are not distinct`)
  assert.ok(report.keyStrengths.length >= 3, `${name}: expected at least 3 key strengths`)
  matchesByArchetype[name] = report.careerMatches
}

// No two archetypes may share a top suggestion, and no two may share a list.
const names = Object.keys(matchesByArchetype)
for (let i = 0; i < names.length; i += 1) {
  for (let j = i + 1; j < names.length; j += 1) {
    const [a, b] = [names[i], names[j]]
    assert.notDeepEqual(matchesByArchetype[a], matchesByArchetype[b], `${a} and ${b} got identical career matches`)
    assert.notEqual(matchesByArchetype[a][0], matchesByArchetype[b][0], `${a} and ${b} got the same top career match`)
  }
}

// Two takers with the SAME Holland code but opposite personality, values and
// motivators must still receive different shortlists — that is what makes the
// suggestion diagnostic rather than a lookup on three letters.
const sameInterests = { I1: 5, I2: 5, EN1: 4, EN2: 4, CV1: 4, CV2: 4, AA1: 2, R1: 2, S1: 2, S2: 2 }
const steady = computeScores(profile({ ...sameInterests, C1: 5, C2: 1, E1: 1, E2: 5, O1: 2, O2: 5, WV6: 5, WV2: 5, WV3: 1, M5: 5, M1: 5, M4: 1 }))
const outgoing = computeScores(profile({ ...sameInterests, C1: 3, C2: 3, E1: 5, E2: 1, O1: 5, O2: 1, WV3: 5, WV1: 5, WV6: 1, M2: 5, M6: 5, M5: 1 }))
assert.equal(steady.hollandCode, outgoing.hollandCode, 'fixture profiles should share a Holland code')
assert.notDeepEqual(
  buildFallbackReport(steady).careerMatches,
  buildFallbackReport(outgoing).careerMatches,
  'same Holland code produced identical career matches — traits/values/drivers are being ignored',
)

console.log('assessment-core.test.mjs: all assertions passed')
