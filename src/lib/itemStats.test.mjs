// Run: node src/lib/itemStats.test.mjs
import assert from 'node:assert/strict'
import { computeItemStats, MIN_N } from './itemStats.js'

// 40 sittings, 3 items. i1 is answered correctly by the strong half only (good
// discrimination). i2 is answered correctly by everyone (too easy). i3 by
// nobody (too hard). Strength is driven by 10 filler items so "rest score"
// varies between sittings.
const rows = []
for (let s = 0; s < 40; s += 1) {
  const strong = s < 20
  const sid = `s${s}`
  rows.push({ submission_id: sid, item_id: 'i1', tier: 'F', subskill: 'a', correct: strong })
  rows.push({ submission_id: sid, item_id: 'i2', tier: 'F', subskill: 'a', correct: true })
  rows.push({ submission_id: sid, item_id: 'i3', tier: 'A', subskill: 'a', correct: false })
  for (let f = 0; f < 10; f += 1) rows.push({ submission_id: sid, item_id: `f${f}`, tier: 'W', subskill: 'a', correct: strong || f < 2 })
}
const stats = Object.fromEntries(computeItemStats(rows).map((s) => [s.item_id, s]))

assert.equal(stats.i1.n, 40)
assert.equal(stats.i1.p, 0.5)
assert.ok(stats.i1.rpb > 0.5, `strong-only item should discriminate well, got ${stats.i1.rpb}`)
assert.deepEqual(stats.i1.flags, [])

assert.equal(stats.i2.p, 1)
assert.ok(stats.i2.flags.includes('too easy'))
assert.equal(stats.i2.rpb, null, 'no variance in correctness means no correlation')

assert.equal(stats.i3.p, 0)
assert.ok(stats.i3.flags.includes('too hard'))

// Below MIN_N nothing is flagged.
const few = computeItemStats(rows.filter((r) => Number(r.submission_id.slice(1)) < MIN_N - 1 - 10))
assert.ok(few.every((s) => s.flags.length === 0), 'no flags below the minimum sample')

console.log('itemStats tests passed')
