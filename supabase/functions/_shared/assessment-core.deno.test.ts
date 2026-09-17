// Deno-side half of the cross-runtime drift guard for assessment-core.js.
// Run inside the Supabase Edge Runtime / any environment with Deno installed:
//   deno test supabase/functions/_shared/assessment-core.deno.test.ts
// Not runnable on this machine (no local Deno install) — verified via the
// Node counterpart (assessment-core.test.mjs) instead; run this one in CI or
// before the first edge-function deploy.
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { validateResponses, computeScores, buildFallbackReport } from './assessment-core.js'
import fixture from './assessment-core.fixture.json' with { type: 'json' }

Deno.test('assessment-core matches the golden vector (Deno runtime)', () => {
  const validation = validateResponses(fixture.responses)
  assertEquals(validation.ok, fixture.expected.validationOk)

  const scores = computeScores(fixture.responses)
  assertEquals(scores, fixture.expected.scores)

  const fallback = buildFallbackReport(scores)
  assertEquals(fallback.headline, fixture.expected.fallbackHeadline)
})
