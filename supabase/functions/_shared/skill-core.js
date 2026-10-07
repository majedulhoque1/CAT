// thriveABL · skill-core — pure scoring for the Skill Assessment module.
// Plain ESM, zero imports: shared by the Deno edge function and node tests,
// same convention as assessment-core.js. SERVER-ONLY at runtime: it takes the
// answer keys, so nothing under src/ may import this file.

export const TIERS = ['F', 'W', 'A']
export const TIER_WEIGHT = { F: 1, W: 2, A: 3 }
export const LEVEL_IDS = ['emerging', 'foundational', 'proficient', 'advanced']
export const BAND_ORDER = ['develop', 'solid', 'strength']

const TIER_PASS_RATIO = 0.75
const STRENGTH_POINTS = 7
const SOLID_POINTS = 4
const LOW_EFFORT_MEDIAN_MS = 3000
const SAME_OPTION_RATIO = 0.9

export const ITEMS_PER_SUBSKILL = 5
export const SUBSKILL_TIER_PATTERN = ['F', 'F', 'W', 'W', 'A']

function median(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function bandForPoints(points) {
  if (points >= STRENGTH_POINTS) return 'strength'
  if (points >= SOLID_POINTS) return 'solid'
  return 'develop'
}

export function bandForSelfRating(rating) {
  if (rating >= 4) return 'strength'
  if (rating === 3) return 'solid'
  return 'develop'
}

export function calibrationLabel(selfBand, measuredBand) {
  const diff = BAND_ORDER.indexOf(selfBand) - BAND_ORDER.indexOf(measuredBand)
  if (diff > 0) return 'over-estimate'
  if (diff < 0) return 'under-estimate'
  return 'accurate'
}

// A tier is passed at 75% (6/8, 6/8, 3/4).
export function tierPassMark(n) {
  return Math.ceil(n * TIER_PASS_RATIO)
}

export function validateSkillResponses(bank, payload) {
  const out = { ok: true, missing: [], invalid: [], unknown: [], selfRatingsInvalid: [] }
  const responses = payload && typeof payload.responses === 'object' && payload.responses ? payload.responses : null
  const selfRatings = payload && typeof payload.selfRatings === 'object' && payload.selfRatings ? payload.selfRatings : null
  if (!responses || !selfRatings) return { ...out, ok: false, missing: ['payload'] }

  const itemById = new Map(bank.items.map((item) => [item.id, item]))

  for (const item of bank.items) {
    if (!(item.id in responses)) {
      out.missing.push(item.id)
    } else if (!item.options.some((o) => o.id === responses[item.id])) {
      out.invalid.push(item.id)
    }
  }
  for (const id of Object.keys(responses)) {
    if (!itemById.has(id)) out.unknown.push(id)
  }
  for (const sub of bank.subskills) {
    const r = selfRatings[sub.id]
    if (!Number.isInteger(r) || r < 1 || r > 5) out.selfRatingsInvalid.push(sub.id)
  }
  out.ok = !out.missing.length && !out.invalid.length && !out.unknown.length && !out.selfRatingsInvalid.length
  return out
}

function cleanTimings(timings) {
  const out = {}
  if (timings && typeof timings === 'object') {
    for (const [id, ms] of Object.entries(timings)) {
      if (Number.isFinite(ms) && ms >= 0) out[id] = Math.min(Math.round(ms), 30 * 60 * 1000)
    }
  }
  return out
}

// Per-item outcomes. Contains correctOptionId, so it is persisted server-side
// and NEVER returned to the browser or stored in the public `result` snapshot.
export function itemOutcomes(bank, keys, responses, timings) {
  const ms = cleanTimings(timings)
  return bank.items.map((item) => {
    const correctOptionId = keys.items[item.id].correct
    return {
      itemId: item.id,
      subskill: item.subskill,
      tier: item.tier,
      optionId: responses[item.id],
      correctOptionId,
      correct: responses[item.id] === correctOptionId,
      ms: item.id in ms ? ms[item.id] : null,
    }
  })
}

export function scoreSkill(bank, keys, responses, selfRatings, timings) {
  const outcomes = itemOutcomes(bank, keys, responses, timings)

  const tiers = {}
  for (const tier of TIERS) {
    const rows = outcomes.filter((o) => o.tier === tier)
    const correct = rows.filter((o) => o.correct).length
    tiers[tier] = { correct, n: rows.length, passed: correct >= tierPassMark(rows.length) }
  }

  // Level = highest consecutive tier passed, starting from the easiest.
  let levelIndex = 0
  for (const tier of TIERS) {
    if (tiers[tier].passed) levelIndex += 1
    else break
  }
  const passedFlags = TIERS.map((t) => tiers[t].passed)
  const firstFail = passedFlags.indexOf(false)
  const mixed = firstFail !== -1 && passedFlags.slice(firstFail + 1).some(Boolean)

  const level = bank.levels[levelIndex]

  const subskills = bank.subskills.map((sub) => {
    const rows = outcomes.filter((o) => o.subskill === sub.id)
    const correct = rows.filter((o) => o.correct).length
    const points = rows.reduce((sum, o) => sum + (o.correct ? TIER_WEIGHT[o.tier] : 0), 0)
    const maxPoints = rows.reduce((sum, o) => sum + TIER_WEIGHT[o.tier], 0)
    const band = bandForPoints(points)
    const selfRating = selfRatings[sub.id]
    const selfBand = bandForSelfRating(selfRating)
    return {
      id: sub.id,
      label: sub.label,
      correct,
      n: rows.length,
      points,
      maxPoints,
      band,
      selfRating,
      selfBand,
      calibration: calibrationLabel(selfBand, band),
    }
  })

  // Misconceptions: the tag on each wrong option actually chosen, grouped by
  // subskill. Explanations describe the concept and never name the right option.
  const weaknesses = []
  for (const sub of subskills) {
    const counts = new Map()
    for (const o of outcomes) {
      if (o.subskill !== sub.id || o.correct) continue
      const tag = keys.items[o.itemId].misconceptions?.[o.optionId]
      if (tag) counts.set(tag, (counts.get(tag) || 0) + 1)
    }
    if (counts.size) {
      const misconceptions = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([tag, count]) => ({
          tag,
          count,
          label: keys.misconceptions[tag]?.label ?? tag,
          explanation: keys.misconceptions[tag]?.explanation ?? '',
        }))
      weaknesses.push({ subskill: sub.id, label: sub.label, misconceptions })
    }
  }

  const nextSteps = subskills.map((sub) => ({
    subskill: sub.id,
    label: sub.label,
    band: sub.band,
    text: bank.subskills.find((s) => s.id === sub.id).nextSteps[sub.band],
  }))

  const timesMs = outcomes.map((o) => o.ms).filter((v) => v !== null)
  const medianMs = median(timesMs)
  const optionCounts = new Map()
  for (const o of outcomes) optionCounts.set(o.optionId, (optionCounts.get(o.optionId) || 0) + 1)
  const sameOption = Math.max(...optionCounts.values()) / outcomes.length >= SAME_OPTION_RATIO
  const lowEffort = (medianMs !== null && medianMs < LOW_EFFORT_MEDIAN_MS) || sameOption

  return {
    skill: bank.slug,
    bankVersion: bank.version,
    level: level.id,
    levelIndex,
    levelLabel: level.label,
    canDo: level.canDo,
    tiers,
    consistency: mixed ? 'mixed' : 'consistent',
    totalCorrect: outcomes.filter((o) => o.correct).length,
    totalItems: outcomes.length,
    subskills,
    strengths: subskills.filter((s) => s.band === 'strength').map((s) => s.id),
    weaknesses,
    nextSteps,
    lowEffort,
    provisional: true,
  }
}

// Integrity checks for a bank + its keys. Returns a list of problems (empty = ok).
// `frozenSubskillIds` guards the course catalog: renaming a subskill id would
// orphan every course tagged with it.
export function validateBank(bank, keys, frozenSubskillIds) {
  const problems = []
  const add = (msg) => problems.push(msg)

  if (!bank.slug || !Number.isInteger(bank.version)) add('bank needs slug and integer version')
  if (!bank.levels || bank.levels.map((l) => l.id).join() !== LEVEL_IDS.join()) add('levels must be emerging, foundational, proficient, advanced in order')
  for (const l of bank.levels || []) if (!l.label || !l.canDo) add(`level ${l.id} needs label and canDo`)

  const subIds = bank.subskills.map((s) => s.id)
  if (subIds.length !== 4) add(`expected 4 subskills, found ${subIds.length}`)
  if (frozenSubskillIds && frozenSubskillIds.join() !== subIds.join()) add(`subskill ids changed: expected ${frozenSubskillIds.join()} got ${subIds.join()}`)
  for (const s of bank.subskills) {
    if (!s.label || !s.selfRatePrompt) add(`subskill ${s.id} needs label and selfRatePrompt`)
    for (const band of BAND_ORDER) if (!s.nextSteps?.[band]) add(`subskill ${s.id} missing nextSteps.${band}`)
  }

  const ids = new Set()
  for (const item of bank.items) {
    if (ids.has(item.id)) add(`duplicate item id ${item.id}`)
    ids.add(item.id)
    if (!subIds.includes(item.subskill)) add(`${item.id}: unknown subskill ${item.subskill}`)
    if (!TIERS.includes(item.tier)) add(`${item.id}: bad tier ${item.tier}`)
    if (!item.prompt) add(`${item.id}: empty prompt`)
    if (item.options.length !== 4) add(`${item.id}: needs exactly 4 options`)
    const optIds = item.options.map((o) => o.id)
    if (new Set(optIds).size !== optIds.length) add(`${item.id}: duplicate option ids`)
    for (const o of item.options) {
      if (!o.text) add(`${item.id}/${o.id}: empty option text`)
      if (/\b(all|none) of the above\b/i.test(o.text)) add(`${item.id}/${o.id}: "all/none of the above" is not allowed`)
    }
    if ('correct' in item || 'rationale' in item) add(`${item.id}: answer data leaked into the public bank`)
    for (const o of item.options) if ('correct' in o) add(`${item.id}/${o.id}: answer data leaked into the public bank`)
  }

  for (const sub of subIds) {
    const pattern = bank.items.filter((i) => i.subskill === sub).map((i) => i.tier).join('')
    if (pattern !== SUBSKILL_TIER_PATTERN.join('')) add(`subskill ${sub}: tiers must be ${SUBSKILL_TIER_PATTERN.join('')} in order, found ${pattern}`)
  }
  if (bank.items.length !== subIds.length * ITEMS_PER_SUBSKILL) add(`expected ${subIds.length * ITEMS_PER_SUBSKILL} items, found ${bank.items.length}`)

  // Keys
  const tagsUsed = new Set()
  for (const item of bank.items) {
    const k = keys.items?.[item.id]
    if (!k) { add(`${item.id}: no key`); continue }
    if (!item.options.some((o) => o.id === k.correct)) add(`${item.id}: key points at a missing option`)
    if (!k.rationale || k.rationale.length < 20) add(`${item.id}: needs a rationale`)
    for (const o of item.options) {
      if (o.id === k.correct) continue
      const tag = k.misconceptions?.[o.id]
      if (!tag) add(`${item.id}/${o.id}: wrong option has no misconception tag`)
      else {
        tagsUsed.add(tag)
        if (!keys.misconceptions?.[tag]) add(`${item.id}/${o.id}: tag ${tag} is not defined`)
      }
    }
    if (k.misconceptions?.[k.correct]) add(`${item.id}: correct option must not carry a misconception`)
  }
  for (const id of Object.keys(keys.items || {})) if (!ids.has(id)) add(`key for unknown item ${id}`)
  for (const [tag, def] of Object.entries(keys.misconceptions || {})) {
    if (!def.label || !def.explanation) add(`tag ${tag} needs label and explanation`)
  }

  // Authoring balance: no answer position or "longest option" shortcut.
  const n = bank.items.length
  const slotCounts = {}
  let longestCorrect = 0
  for (const item of bank.items) {
    const k = keys.items?.[item.id]
    if (!k) continue
    const idx = item.options.findIndex((o) => o.id === k.correct)
    slotCounts[idx] = (slotCounts[idx] || 0) + 1
    const correctLen = item.options[idx]?.text.length ?? 0
    const otherLens = item.options.filter((_, i) => i !== idx).map((o) => o.text.length)
    if (correctLen > Math.max(...otherLens)) longestCorrect += 1
  }
  for (const [idx, count] of Object.entries(slotCounts)) {
    if (count / n > 0.35) add(`correct answer sits in slot ${idx} for ${count}/${n} items (max 35%)`)
  }
  if (longestCorrect / n > 0.4) add(`correct option is the longest in ${longestCorrect}/${n} items (max 40%)`)

  return problems
}
