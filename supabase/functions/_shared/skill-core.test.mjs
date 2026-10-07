// Unit tests for skill-core.js on a synthetic bank (content-independent), plus
// integrity tests over every real bank in the registry.
// Run: node supabase/functions/_shared/skill-core.test.mjs
import assert from 'node:assert/strict'
import {
  validateSkillResponses, scoreSkill, itemOutcomes, validateBank,
  bandForPoints, bandForSelfRating, calibrationLabel, tierPassMark, LEVEL_IDS,
} from './skill-core.js'

// ---------- synthetic bank ----------
const TIER_PATTERN = ['F', 'F', 'W', 'W', 'A']
const SUBS = ['s1', 's2', 's3', 's4']

function makeBank() {
  const items = []
  const keyItems = {}
  let n = 0
  for (const sub of SUBS) {
    TIER_PATTERN.forEach((tier, i) => {
      const id = `${sub}-${i + 1}`
      const correctIdx = (n * 3 + Math.floor(n / 4)) % 4 // spread across slots
      const letters = ['a', 'b', 'c', 'd']
      // equal-length option text so "longest correct" never trips
      const options = letters.map((l) => ({ id: l, text: `Option ${l} text for ${id}` }))
      items.push({ id, subskill: sub, tier, prompt: `Question ${id}?`, options })
      const misconceptions = {}
      letters.forEach((l, idx) => { if (idx !== correctIdx) misconceptions[l] = `tag-${sub}-${l}` })
      keyItems[id] = { correct: letters[correctIdx], rationale: `Rationale for ${id}, long enough to pass.`, misconceptions }
      n += 1
    })
  }
  const misconceptions = {}
  for (const sub of SUBS) for (const l of ['a', 'b', 'c', 'd']) {
    misconceptions[`tag-${sub}-${l}`] = { label: `Mistake ${sub}-${l}`, explanation: `Concept note ${sub}-${l}.` }
  }
  const bank = {
    slug: 'test-skill', version: 1, title: 'Test', summary: 's', minutes: 12, riasecAffinity: ['I'],
    levels: LEVEL_IDS.map((id) => ({ id, label: id.toUpperCase(), canDo: `can do ${id}` })),
    subskills: SUBS.map((id) => ({
      id, label: `Sub ${id}`, selfRatePrompt: 'rate',
      nextSteps: { develop: `${id} develop`, solid: `${id} solid`, strength: `${id} strength` },
    })),
    items,
  }
  return { bank, keys: { items: keyItems, misconceptions } }
}

const { bank, keys } = makeBank()
const correctAnswers = () => Object.fromEntries(bank.items.map((i) => [i.id, keys.items[i.id].correct]))
const wrongOption = (id) => bank.items.find((i) => i.id === id).options.find((o) => o.id !== keys.items[id].correct).id
const ratings = (v) => Object.fromEntries(SUBS.map((s) => [s, v]))

// answers where only the given tiers are fully correct, everything else wrong
function answersWith(tiersCorrect) {
  const out = {}
  for (const item of bank.items) out[item.id] = tiersCorrect.includes(item.tier) ? keys.items[item.id].correct : wrongOption(item.id)
  return out
}

assert.deepEqual(validateBank(bank, keys, SUBS), [], 'synthetic bank should validate')

// ---------- thresholds ----------
assert.equal(tierPassMark(8), 6)
assert.equal(tierPassMark(4), 3)
assert.equal(bandForPoints(9), 'strength')
assert.equal(bandForPoints(7), 'strength')
assert.equal(bandForPoints(6), 'solid')
assert.equal(bandForPoints(4), 'solid')
assert.equal(bandForPoints(3), 'develop')
assert.equal(bandForPoints(0), 'develop')
assert.equal(bandForSelfRating(1), 'develop')
assert.equal(bandForSelfRating(2), 'develop')
assert.equal(bandForSelfRating(3), 'solid')
assert.equal(bandForSelfRating(4), 'strength')
assert.equal(bandForSelfRating(5), 'strength')
assert.equal(calibrationLabel('strength', 'develop'), 'over-estimate')
assert.equal(calibrationLabel('develop', 'solid'), 'under-estimate')
assert.equal(calibrationLabel('solid', 'solid'), 'accurate')

// ---------- levels ----------
const all = scoreSkill(bank, keys, correctAnswers(), ratings(5))
assert.equal(all.level, 'advanced')
assert.equal(all.totalCorrect, 20)
assert.equal(all.consistency, 'consistent')
assert.ok(all.subskills.every((s) => s.points === 9 && s.band === 'strength'))
assert.equal(all.provisional, true)

const none = scoreSkill(bank, keys, answersWith([]), ratings(1))
assert.equal(none.level, 'emerging')
assert.equal(none.totalCorrect, 0)
assert.ok(none.subskills.every((s) => s.band === 'develop'))

const fOnly = scoreSkill(bank, keys, answersWith(['F']), ratings(3))
assert.equal(fOnly.level, 'foundational')
assert.equal(fOnly.consistency, 'consistent')

const fw = scoreSkill(bank, keys, answersWith(['F', 'W']), ratings(3))
assert.equal(fw.level, 'proficient')
assert.equal(fw.consistency, 'consistent')

// passes W and A but fails F -> level Emerging, flagged mixed
const waOnly = scoreSkill(bank, keys, answersWith(['W', 'A']), ratings(3))
assert.equal(waOnly.level, 'emerging')
assert.equal(waOnly.consistency, 'mixed')

// passes F and A but fails W -> Foundational, mixed
const faOnly = scoreSkill(bank, keys, answersWith(['F', 'A']), ratings(3))
assert.equal(faOnly.level, 'foundational')
assert.equal(faOnly.consistency, 'mixed')

// exact tier boundary: 6/8 F passes, 5/8 fails
{
  const answers = answersWith([])
  const fItems = bank.items.filter((i) => i.tier === 'F')
  fItems.slice(0, 5).forEach((i) => { answers[i.id] = keys.items[i.id].correct })
  assert.equal(scoreSkill(bank, keys, answers, ratings(3)).tiers.F.passed, false, '5/8 must fail')
  answers[fItems[5].id] = keys.items[fItems[5].id].correct
  assert.equal(scoreSkill(bank, keys, answers, ratings(3)).tiers.F.passed, true, '6/8 must pass')
}

// exact subskill band boundary: F,F,W,A right = 1+1+2+3 = 7 -> strength; F,F,W,W = 6 -> solid
{
  const answers = answersWith([])
  const set = (ids) => ids.forEach((id) => { answers[id] = keys.items[id].correct })
  set(['s1-1', 's1-2', 's1-3', 's1-5'])
  set(['s2-1', 's2-2', 's2-3', 's2-4'])
  const r = scoreSkill(bank, keys, answers, ratings(3))
  assert.equal(r.subskills.find((s) => s.id === 's1').points, 7)
  assert.equal(r.subskills.find((s) => s.id === 's1').band, 'strength')
  assert.equal(r.subskills.find((s) => s.id === 's2').points, 6)
  assert.equal(r.subskills.find((s) => s.id === 's2').band, 'solid')
}

// ---------- calibration ----------
{
  const r = scoreSkill(bank, keys, answersWith([]), { s1: 5, s2: 3, s3: 1, s4: 2 })
  assert.equal(r.subskills[0].calibration, 'over-estimate')
  assert.equal(r.subskills[1].calibration, 'over-estimate')
  assert.equal(r.subskills[2].calibration, 'accurate')
  const r2 = scoreSkill(bank, keys, correctAnswers(), { s1: 1, s2: 5, s3: 3, s4: 4 })
  assert.equal(r2.subskills[0].calibration, 'under-estimate')
  assert.equal(r2.subskills[1].calibration, 'accurate')
}

// ---------- misconceptions ----------
{
  const answers = correctAnswers()
  answers['s1-1'] = wrongOption('s1-1')
  answers['s1-2'] = wrongOption('s1-2')
  const r = scoreSkill(bank, keys, answers, ratings(3))
  assert.equal(r.weaknesses.length, 1)
  assert.equal(r.weaknesses[0].subskill, 's1')
  assert.equal(r.weaknesses[0].misconceptions.length, 2)
  assert.ok(r.weaknesses[0].misconceptions.every((m) => m.explanation.startsWith('Concept note')))
  // the public result must never carry answer keys
  const serialized = JSON.stringify(r)
  assert.ok(!serialized.includes('Rationale for'), 'rationale leaked into result')
  assert.ok(!serialized.includes('correctOptionId'), 'correctOptionId leaked into result')
}

// ---------- low effort ----------
{
  const fast = Object.fromEntries(bank.items.map((i) => [i.id, 1200]))
  assert.equal(scoreSkill(bank, keys, correctAnswers(), ratings(3), fast).lowEffort, true)
  const slow = Object.fromEntries(bank.items.map((i) => [i.id, 9000]))
  assert.equal(scoreSkill(bank, keys, correctAnswers(), ratings(3), slow).lowEffort, false)
  assert.equal(scoreSkill(bank, keys, correctAnswers(), ratings(3)).lowEffort, false, 'no timings = not flagged')
  const straight = Object.fromEntries(bank.items.map((i) => [i.id, 'a']))
  assert.equal(scoreSkill(bank, keys, straight, ratings(3), slow).lowEffort, true, 'straight-lining is flagged')
}

// ---------- outcomes carry the key (server-only) ----------
{
  const rows = itemOutcomes(bank, keys, correctAnswers(), { 's1-1': 4000 })
  assert.equal(rows.length, 20)
  assert.ok(rows.every((r) => r.correct && r.correctOptionId === r.optionId))
  assert.equal(rows[0].ms, 4000)
  assert.equal(rows[1].ms, null)
}

// ---------- validation ----------
{
  const good = { responses: correctAnswers(), selfRatings: ratings(3) }
  assert.equal(validateSkillResponses(bank, good).ok, true)

  const missing = { responses: { ...correctAnswers() }, selfRatings: ratings(3) }
  delete missing.responses['s1-1']
  assert.deepEqual(validateSkillResponses(bank, missing).missing, ['s1-1'])

  const invalid = { responses: { ...correctAnswers(), 's1-2': 'z' }, selfRatings: ratings(3) }
  assert.deepEqual(validateSkillResponses(bank, invalid).invalid, ['s1-2'])

  const unknown = { responses: { ...correctAnswers(), 'zz-9': 'a' }, selfRatings: ratings(3) }
  assert.deepEqual(validateSkillResponses(bank, unknown).unknown, ['zz-9'])

  const badRating = { responses: correctAnswers(), selfRatings: { ...ratings(3), s2: 9 } }
  assert.deepEqual(validateSkillResponses(bank, badRating).selfRatingsInvalid, ['s2'])

  const noRating = { responses: correctAnswers(), selfRatings: { s1: 3 } }
  assert.equal(validateSkillResponses(bank, noRating).selfRatingsInvalid.length, 3)

  assert.equal(validateSkillResponses(bank, { responses: correctAnswers() }).ok, false)
  assert.equal(validateSkillResponses(bank, null).ok, false)
}

// ---------- validateBank catches authoring faults ----------
{
  const b2 = structuredClone(bank)
  b2.items[0].options[0].text = 'None of the above'
  assert.ok(validateBank(b2, keys).some((p) => /none of the above/i.test(p)))

  const k2 = structuredClone(keys)
  delete k2.items['s1-1']
  assert.ok(validateBank(bank, k2).some((p) => p.includes('s1-1: no key')))

  const b3 = structuredClone(bank)
  b3.items[0].correct = 'a'
  assert.ok(validateBank(b3, keys).some((p) => p.includes('leaked')))

  const b4 = structuredClone(bank)
  b4.items = b4.items.slice(0, 19)
  assert.ok(validateBank(b4, keys).length > 0)

  assert.ok(validateBank(bank, keys, ['s1', 's2', 's3', 'sX']).some((p) => p.includes('subskill ids changed')))

  // every correct answer in slot 0 -> position bias
  const k3 = structuredClone(keys)
  for (const item of bank.items) {
    const cur = k3.items[item.id].correct
    const mis = k3.items[item.id].misconceptions
    const tagForA = mis.a
    if (cur !== 'a') { mis[cur] = tagForA; delete mis.a; k3.items[item.id].correct = 'a' }
  }
  assert.ok(validateBank(bank, k3).some((p) => p.includes('slot 0')))

  // correct is always the longest -> length bias
  const b5 = structuredClone(bank)
  for (const item of b5.items) {
    const c = keys.items[item.id].correct
    item.options.find((o) => o.id === c).text += ' with a lot more explanatory detail appended'
  }
  assert.ok(validateBank(b5, keys).some((p) => p.includes('longest')))
}

console.log('skill-core synthetic tests passed')

// ---------- real banks (once they exist) ----------
let registry
try {
  registry = await import('./skills/registry.js')
} catch (e) {
  if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e
}
if (registry) {
  for (const meta of registry.listSkills()) {
    const realBank = (await import(`./skills/${meta.slug}.bank.js`)).default
    // The answer keys are deliberately not in the public repo (see .gitignore),
    // so a fresh clone has none. Skip the key checks rather than fail the suite.
    let realKeys
    try {
      realKeys = (await import(`./skills/${meta.slug}.keys.js`)).default
    } catch (e) {
      if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e
      console.log(`  ${meta.slug}: keys not present in this checkout, key checks skipped`)
      continue
    }
    const frozen = meta.subskills.map((s) => s.id)
    assert.deepEqual(validateBank(realBank, realKeys, frozen), [], `${meta.slug} bank/keys must validate`)
    assert.deepEqual(meta.subskills.map((s) => s.id), realBank.subskills.map((s) => s.id))
    // answer data must not be reachable from the public bank
    const pub = JSON.stringify(realBank)
    for (const k of Object.values(realKeys.items)) {
      assert.ok(!pub.includes(k.rationale), `${meta.slug}: a rationale appears in the public bank`)
    }
    for (const def of Object.values(realKeys.misconceptions)) {
      assert.ok(!pub.includes(def.explanation), `${meta.slug}: a misconception explanation appears in the public bank`)
    }
    // the all-correct run reaches Advanced, the all-wrong run Emerging
    const allRight = Object.fromEntries(realBank.items.map((i) => [i.id, realKeys.items[i.id].correct]))
    const allWrong = Object.fromEntries(realBank.items.map((i) => [i.id, i.options.find((o) => o.id !== realKeys.items[i.id].correct).id]))
    const sr = Object.fromEntries(realBank.subskills.map((s) => [s.id, 3]))
    assert.equal(scoreSkill(realBank, realKeys, allRight, sr).level, 'advanced')
    assert.equal(scoreSkill(realBank, realKeys, allWrong, sr).level, 'emerging')
    console.log(`  ${meta.slug}: ${realBank.items.length} items valid`)
  }
  console.log('skill-core real-bank tests passed')
}
