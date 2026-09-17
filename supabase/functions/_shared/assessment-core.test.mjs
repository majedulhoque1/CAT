// Node-side half of the cross-runtime drift guard for assessment-core.js.
// Run: node supabase/functions/_shared/assessment-core.test.mjs
// The Deno-side equivalent is assessment-core.deno.test.ts — both assert the
// same fixture so a change that only touches one runtime's copy is caught.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { validateResponses, computeScores, buildFallbackReport } from './assessment-core.js'

const here = dirname(fileURLToPath(import.meta.url))
const fixture = JSON.parse(readFileSync(join(here, 'assessment-core.fixture.json'), 'utf8'))

const validation = validateResponses(fixture.responses)
assert.equal(validation.ok, fixture.expected.validationOk, 'validateResponses.ok mismatch')

const scores = computeScores(fixture.responses)
assert.deepEqual(scores, fixture.expected.scores, 'computeScores output mismatch')

const fallback = buildFallbackReport(scores)
assert.equal(fallback.headline, fixture.expected.fallbackHeadline, 'buildFallbackReport headline mismatch')

console.log('assessment-core.test.mjs: all assertions passed')
