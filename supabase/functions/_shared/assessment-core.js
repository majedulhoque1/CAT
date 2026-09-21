// thriveABL CAT — shared scoring core. Plain ESM, zero imports, so this exact
// file is consumed unmodified by both the submit-assessment edge function
// (Deno) and the browser (Vite resolves the relative path with no config
// change). Do not duplicate this logic anywhere else — the client's own copy
// is a re-export shim, not a second implementation. See assessment-core.fixture.json.

export const SECTIONS = [
  {
    id: 'bigfive',
    label: '01',
    title: 'Personality',
    subtitle: 'Big Five - Goldberg (1992) IPIP',
    items: [
      { id: 'O1', text: 'I enjoy exploring abstract ideas and conceptual problems.', factor: 'O', reverse: false },
      { id: 'O2', text: 'I prefer familiar routines over trying new and different approaches.', factor: 'O', reverse: true },
      { id: 'C1', text: 'I complete tasks thoroughly and consistently meet deadlines.', factor: 'C', reverse: false },
      { id: 'C2', text: 'I often start projects but struggle to see them through to completion.', factor: 'C', reverse: true },
      { id: 'E1', text: 'I feel energised by spending time in large social gatherings.', factor: 'E', reverse: false },
      { id: 'E2', text: 'I prefer working independently rather than collaborating with a team.', factor: 'E', reverse: true },
      { id: 'A1', text: "I genuinely care about others' wellbeing and actively try to help.", factor: 'A', reverse: false },
      { id: 'A2', text: 'I tend to prioritise my own goals over maintaining group harmony.', factor: 'A', reverse: true },
      { id: 'ES1', text: 'I stay calm and composed when dealing with high-pressure situations.', factor: 'ES', reverse: false },
      { id: 'ES2', text: 'I frequently feel anxious or overwhelmed by work-related pressure.', factor: 'ES', reverse: true },
    ],
  },
  {
    id: 'riasec',
    label: '02',
    title: 'Career Interests',
    subtitle: 'RIASEC Holland Code - IIP Markers',
    items: [
      { id: 'R1', text: 'I enjoy working with tools, machinery, or physical materials.', type: 'R' },
      { id: 'R2', text: 'I prefer hands-on, practical tasks over abstract or theoretical work.', type: 'R' },
      { id: 'I1', text: 'I enjoy conducting research and finding evidence-based solutions.', type: 'I' },
      { id: 'I2', text: 'I am drawn to scientific reasoning, data analysis, and problem-solving.', type: 'I' },
      { id: 'AA1', text: 'I find deep satisfaction in expressing ideas through creative work.', type: 'A' },
      { id: 'AA2', text: 'I am drawn to roles where I can design, write, or produce original output.', type: 'A' },
      { id: 'S1', text: 'I get genuine fulfilment from teaching, coaching, or supporting others.', type: 'S' },
      { id: 'S2', text: 'I prefer roles where human interaction and helping people is central.', type: 'S' },
      { id: 'EN1', text: 'I enjoy persuading, leading, and motivating others toward shared goals.', type: 'E' },
      { id: 'EN2', text: 'I am energised by competitive environments where I can take charge.', type: 'E' },
      { id: 'CV1', text: 'I prefer structured work with clear procedures and defined expectations.', type: 'C' },
      { id: 'CV2', text: 'I find satisfaction in organising data, systems, or detailed information.', type: 'C' },
    ],
  },
  {
    id: 'values',
    label: '03',
    title: 'Work Values',
    subtitle: 'O*Net Framework',
    items: [
      { id: 'WV1', text: 'Feeling a genuine sense of accomplishment from my work is essential.', value: 'Achievement' },
      { id: 'WV2', text: 'Having the freedom to make my own work decisions matters greatly to me.', value: 'Independence' },
      { id: 'WV3', text: 'Receiving acknowledgment and recognition for my contributions is important.', value: 'Recognition' },
      { id: 'WV4', text: 'Building meaningful positive relationships with colleagues is a priority.', value: 'Relationships' },
      { id: 'WV5', text: 'Having a supportive manager and team environment is critical to my output.', value: 'Support' },
      { id: 'WV6', text: 'The comfort and quality of my physical work environment impacts me deeply.', value: 'Working Conditions' },
    ],
  },
  {
    id: 'motivation',
    label: '04',
    title: 'Motivation',
    subtitle: "SDT and McClelland's Need Theory",
    items: [
      { id: 'M1', text: 'Continuously developing my expertise and mastering new skills drives me.', driver: 'Mastery' },
      { id: 'M2', text: 'Career progression and upward advancement are key factors in my choices.', driver: 'Advancement' },
      { id: 'M3', text: 'I feel most motivated when collaborating closely with others on shared goals.', driver: 'Teamwork' },
      { id: 'M4', text: 'I need my work to contribute to something larger than individual outcomes.', driver: 'Purpose' },
      { id: 'M5', text: 'High earning potential and financial reward heavily influence my decisions.', driver: 'Financial Reward' },
      { id: 'M6', text: 'I prefer dynamic, fast-changing environments over stable, predictable ones.', driver: 'Adaptability' },
    ],
  },
]

export const BF_LABELS = { O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', ES: 'Emotional Stability' }
export const RI_LABELS = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' }

export const RESPONSE_ITEM_META = SECTIONS.flatMap((section) =>
  section.items.map((item, index) => ({
    id: item.id,
    sectionId: section.id,
    sectionLabel: section.label,
    sectionTitle: section.title,
    questionOrder: index + 1,
    prompt: item.text,
  })),
)

const RESPONSE_ITEM_IDS = new Set(RESPONSE_ITEM_META.map((item) => item.id))

export function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 3
}

export function scoreBigFive(responses) {
  const groups = { O: [], C: [], E: [], A: [], ES: [] }
  SECTIONS[0].items.forEach((item) => {
    if (responses[item.id] !== undefined) {
      groups[item.factor].push(item.reverse ? 6 - responses[item.id] : responses[item.id])
    }
  })
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, average(values)]))
}

export function scoreRIASEC(responses) {
  const groups = { R: [], I: [], A: [], S: [], E: [], C: [] }
  SECTIONS[1].items.forEach((item) => {
    if (responses[item.id] !== undefined) {
      groups[item.type].push(responses[item.id])
    }
  })
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, average(values)]))
}

export function scoreValues(responses) {
  return Object.fromEntries(SECTIONS[2].items.map((item) => [item.value, responses[item.id] || 3]))
}

export function scoreMotivation(responses) {
  return Object.fromEntries(SECTIONS[3].items.map((item) => [item.driver, responses[item.id] || 3]))
}

export function getTop(obj, count) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, count).map(([key]) => key)
}

export function pct(score) {
  return Math.round(((score - 1) / 4) * 100)
}

// All 34 ids present and each value a 1-5 integer. Fails loudly rather than
// silently degrading — the client-side scorers historically defaulted a
// missing answer to 3, which yields a plausible but fabricated profile.
export function validateResponses(responses) {
  const missing = []
  const invalid = []
  for (const item of RESPONSE_ITEM_META) {
    const value = responses ? responses[item.id] : undefined
    if (value === undefined || value === null) {
      missing.push(item.id)
    } else if (!Number.isInteger(value) || value < 1 || value > 5) {
      invalid.push(item.id)
    }
  }
  // Reject any key that isn't one of the 34 known ids — the strict allowlist
  // the plan calls for at the edge-function boundary.
  const unknown = responses ? Object.keys(responses).filter((key) => !RESPONSE_ITEM_IDS.has(key)) : []
  return { ok: missing.length === 0 && invalid.length === 0 && unknown.length === 0, missing, invalid, unknown }
}

export function computeScores(responses) {
  const bf = scoreBigFive(responses)
  const ri = scoreRIASEC(responses)
  const wv = scoreValues(responses)
  const mv = scoreMotivation(responses)
  return {
    bf,
    ri,
    wv,
    mv,
    hollandCode: getTop(ri, 3).join(''),
    topValues: getTop(wv, 3),
    topMotivators: getTop(mv, 2),
  }
}

// ============================================================
// Career matching — the diagnostic half of the deterministic report.
//
// Every suggestion below is derived from the taker's own four score sets. The
// previous implementation returned one hardcoded five-role list to everybody,
// so every submission that rendered the fallback — which is EVERY submission at
// insert time, since the row is written before OpenRouter is ever called —
// carried an identical "Suggested Career Directions" block. The congruence
// model follows the standard Holland-first weighting: interests dominate,
// personality traits modulate, values and drivers break the remaining ties.
// ============================================================

// riasec: the role's own interest themes, most-defining first.
// traits:  Big Five affinity. A positive weight means the role rewards a HIGH
//          score on that trait, a negative weight a LOW one.
// values / drivers: the O*Net work values and motivational drivers the role
//          actually tends to supply.
export const CAREER_LIBRARY = [
  // --- Realistic-led ---
  { title: 'Mechanical engineer', riasec: ['R', 'I', 'C'], traits: { C: 0.8, O: 0.4 }, values: ['Achievement', 'Working Conditions'], drivers: ['Mastery'] },
  { title: 'Civil / site engineer', riasec: ['R', 'C', 'E'], traits: { C: 0.9, ES: 0.5 }, values: ['Achievement', 'Working Conditions'], drivers: ['Mastery', 'Advancement'] },
  { title: 'Electrical technician', riasec: ['R', 'C'], traits: { C: 0.8, E: -0.2 }, values: ['Independence', 'Working Conditions'], drivers: ['Financial Reward', 'Mastery'] },
  { title: 'Environmental field officer', riasec: ['R', 'S', 'I'], traits: { A: 0.5, C: 0.5 }, values: ['Working Conditions', 'Relationships'], drivers: ['Purpose'] },
  { title: 'Industrial / product designer', riasec: ['R', 'A', 'I'], traits: { O: 0.9, C: 0.5 }, values: ['Achievement', 'Independence'], drivers: ['Mastery'] },
  { title: 'Logistics and supply chain coordinator', riasec: ['R', 'C', 'E'], traits: { C: 0.9, ES: 0.5 }, values: ['Achievement', 'Support'], drivers: ['Advancement', 'Adaptability'] },

  // --- Investigative-led ---
  { title: 'Data analyst', riasec: ['I', 'C'], traits: { C: 0.8, O: 0.6 }, values: ['Achievement', 'Independence'], drivers: ['Mastery'] },
  { title: 'Research scientist', riasec: ['I', 'R', 'A'], traits: { O: 0.9, C: 0.7, E: -0.3 }, values: ['Independence', 'Achievement'], drivers: ['Mastery', 'Purpose'] },
  { title: 'Software engineer', riasec: ['I', 'R', 'C'], traits: { O: 0.7, C: 0.7 }, values: ['Independence', 'Achievement'], drivers: ['Mastery', 'Financial Reward'] },
  { title: 'Clinical laboratory scientist', riasec: ['I', 'R', 'C'], traits: { C: 0.9, ES: 0.5 }, values: ['Achievement', 'Working Conditions'], drivers: ['Mastery', 'Purpose'] },
  { title: 'Public health / epidemiology analyst', riasec: ['I', 'S', 'C'], traits: { O: 0.7, C: 0.7 }, values: ['Achievement', 'Relationships'], drivers: ['Purpose', 'Mastery'] },
  { title: 'UX researcher', riasec: ['I', 'A', 'S'], traits: { O: 0.8, A: 0.5 }, values: ['Achievement', 'Relationships'], drivers: ['Mastery', 'Purpose'] },
  { title: 'Financial analyst', riasec: ['I', 'C', 'E'], traits: { C: 0.9, ES: 0.6 }, values: ['Achievement', 'Recognition'], drivers: ['Financial Reward', 'Advancement'] },
  { title: 'Actuary / risk analyst', riasec: ['I', 'C'], traits: { C: 1, ES: 0.6, E: -0.3 }, values: ['Achievement', 'Working Conditions'], drivers: ['Financial Reward', 'Mastery'] },

  // --- Artistic-led ---
  { title: 'Graphic / visual designer', riasec: ['A', 'I', 'R'], traits: { O: 1, C: 0.4 }, values: ['Independence', 'Recognition'], drivers: ['Mastery', 'Adaptability'] },
  { title: 'Copywriter / content writer', riasec: ['A', 'I', 'E'], traits: { O: 0.9 }, values: ['Independence', 'Recognition'], drivers: ['Mastery', 'Adaptability'] },
  { title: 'Art director', riasec: ['A', 'E', 'I'], traits: { O: 0.9, E: 0.6 }, values: ['Recognition', 'Independence'], drivers: ['Advancement', 'Adaptability'] },
  { title: 'Architect', riasec: ['A', 'I', 'R'], traits: { O: 0.9, C: 0.8 }, values: ['Achievement', 'Independence'], drivers: ['Mastery', 'Advancement'] },
  { title: 'Video producer / filmmaker', riasec: ['A', 'E', 'R'], traits: { O: 1, E: 0.5 }, values: ['Independence', 'Recognition'], drivers: ['Adaptability', 'Mastery'] },
  { title: 'Audio / music producer', riasec: ['A', 'R', 'I'], traits: { O: 1, E: -0.2 }, values: ['Independence', 'Recognition'], drivers: ['Mastery', 'Adaptability'] },
  { title: 'Brand and communications strategist', riasec: ['A', 'E', 'S'], traits: { O: 0.8, E: 0.7 }, values: ['Recognition', 'Achievement'], drivers: ['Advancement', 'Adaptability'] },

  // --- Social-led ---
  { title: 'Teacher / educator', riasec: ['S', 'A', 'C'], traits: { A: 0.9, E: 0.6, ES: 0.5 }, values: ['Relationships', 'Support'], drivers: ['Purpose', 'Teamwork'] },
  { title: 'Counsellor / therapist', riasec: ['S', 'I', 'A'], traits: { A: 1, ES: 0.8 }, values: ['Relationships', 'Support'], drivers: ['Purpose', 'Mastery'] },
  { title: 'Learning and development specialist', riasec: ['S', 'E', 'A'], traits: { A: 0.7, E: 0.7 }, values: ['Relationships', 'Achievement'], drivers: ['Purpose', 'Teamwork'] },
  { title: 'People operations partner', riasec: ['S', 'E', 'C'], traits: { A: 0.8, C: 0.7, ES: 0.6 }, values: ['Relationships', 'Support'], drivers: ['Teamwork', 'Purpose'] },
  { title: 'Nurse / allied health practitioner', riasec: ['S', 'R', 'I'], traits: { A: 0.9, C: 0.8, ES: 0.7 }, values: ['Relationships', 'Support'], drivers: ['Purpose', 'Teamwork'] },
  { title: 'Community / NGO programme officer', riasec: ['S', 'E', 'C'], traits: { A: 0.9, O: 0.5 }, values: ['Relationships', 'Support'], drivers: ['Purpose', 'Teamwork'] },
  { title: 'Customer success manager', riasec: ['S', 'E', 'C'], traits: { A: 0.8, E: 0.8, ES: 0.6 }, values: ['Relationships', 'Recognition'], drivers: ['Teamwork', 'Advancement'] },
  { title: 'Social worker / case manager', riasec: ['S', 'I', 'C'], traits: { A: 1, ES: 0.8 }, values: ['Relationships', 'Support'], drivers: ['Purpose', 'Teamwork'] },

  // --- Enterprising-led ---
  { title: 'Business development manager', riasec: ['E', 'S', 'C'], traits: { E: 1, ES: 0.7, A: 0.3 }, values: ['Recognition', 'Achievement'], drivers: ['Financial Reward', 'Advancement'] },
  { title: 'Product manager', riasec: ['E', 'I', 'S'], traits: { O: 0.8, E: 0.7, C: 0.6 }, values: ['Achievement', 'Recognition'], drivers: ['Advancement', 'Mastery'] },
  { title: 'Founder / independent operator', riasec: ['E', 'A', 'I'], traits: { O: 0.9, E: 0.8, ES: 0.7 }, values: ['Independence', 'Recognition'], drivers: ['Advancement', 'Adaptability'] },
  { title: 'Marketing manager', riasec: ['E', 'A', 'S'], traits: { E: 0.8, O: 0.7 }, values: ['Recognition', 'Achievement'], drivers: ['Advancement', 'Adaptability'] },
  { title: 'Management consultant', riasec: ['E', 'I', 'C'], traits: { C: 0.8, O: 0.7, E: 0.7 }, values: ['Achievement', 'Recognition'], drivers: ['Advancement', 'Financial Reward'] },
  { title: 'Operations manager', riasec: ['E', 'C', 'R'], traits: { C: 1, ES: 0.7, E: 0.6 }, values: ['Achievement', 'Support'], drivers: ['Advancement', 'Teamwork'] },
  { title: 'Partnerships and PR lead', riasec: ['E', 'S', 'A'], traits: { E: 0.9, A: 0.6 }, values: ['Recognition', 'Relationships'], drivers: ['Advancement', 'Adaptability'] },
  { title: 'Project manager', riasec: ['E', 'C', 'S'], traits: { C: 1, E: 0.6, ES: 0.6 }, values: ['Achievement', 'Support'], drivers: ['Advancement', 'Teamwork'] },

  // --- Conventional-led ---
  { title: 'Accountant / auditor', riasec: ['C', 'I', 'E'], traits: { C: 1, ES: 0.5, O: -0.2 }, values: ['Achievement', 'Working Conditions'], drivers: ['Financial Reward', 'Mastery'] },
  { title: 'Compliance and quality officer', riasec: ['C', 'I', 'R'], traits: { C: 1, ES: 0.6 }, values: ['Working Conditions', 'Support'], drivers: ['Mastery', 'Purpose'] },
  { title: 'Business / operations analyst', riasec: ['C', 'I', 'E'], traits: { C: 0.9, O: 0.5 }, values: ['Achievement', 'Independence'], drivers: ['Mastery', 'Advancement'] },
  { title: 'Office and administration coordinator', riasec: ['C', 'S', 'E'], traits: { C: 0.9, A: 0.7 }, values: ['Support', 'Working Conditions'], drivers: ['Teamwork', 'Adaptability'] },
  { title: 'Database / systems administrator', riasec: ['C', 'R', 'I'], traits: { C: 1, O: 0.4, E: -0.3 }, values: ['Working Conditions', 'Independence'], drivers: ['Mastery', 'Financial Reward'] },
  { title: 'Paralegal / legal operations', riasec: ['C', 'I', 'S'], traits: { C: 1, ES: 0.5 }, values: ['Achievement', 'Working Conditions'], drivers: ['Mastery', 'Advancement'] },
  { title: 'Librarian / information manager', riasec: ['C', 'I', 'S'], traits: { C: 0.9, O: 0.6, E: -0.2 }, values: ['Working Conditions', 'Relationships'], drivers: ['Mastery', 'Purpose'] },
]

// A 1-5 Likert mean expressed on 0-1, so every sub-score below is comparable.
function unit(score) {
  return Math.max(0, Math.min(1, ((typeof score === 'number' ? score : 3) - 1) / 4))
}

// How much each of a role's own interest themes counts, most-defining first.
const THEME_WEIGHTS = [1, 0.6, 0.35]

export function careerFit(career, scores) {
  const { bf = {}, ri = {}, wv = {}, mv = {} } = scores

  // Interest congruence, computed against the taker's continuous RIASEC means
  // rather than their three-letter code — two people who both code "EIA" but at
  // different intensities get different, correctly ordered shortlists.
  let interest = 0
  let interestWeight = 0
  career.riasec.forEach((theme, position) => {
    const weight = THEME_WEIGHTS[position] ?? 0.2
    interest += weight * unit(ri[theme])
    interestWeight += weight
  })
  interest = interestWeight ? interest / interestWeight : 0.5

  // Trait fit. Signed weights mean a role that genuinely suits a low scorer —
  // deep solo work for a low-Extraversion profile, say — scores UP for them,
  // instead of every role rewarding the same "more of everything" personality.
  let trait = 0
  let traitWeight = 0
  for (const [factor, weight] of Object.entries(career.traits || {})) {
    trait += weight * (unit(bf[factor]) - 0.5) * 2
    traitWeight += Math.abs(weight)
  }
  trait = traitWeight ? (trait / traitWeight + 1) / 2 : 0.5

  // Does the role actually supply the conditions and drivers this person rates
  // highly? This is what separates two roles sharing the same Holland themes.
  const value = career.values?.length
    ? career.values.reduce((sum, v) => sum + unit(wv[v]), 0) / career.values.length
    : 0.5
  const driver = career.drivers?.length
    ? career.drivers.reduce((sum, d) => sum + unit(mv[d]), 0) / career.drivers.length
    : 0.5

  return 0.5 * interest + 0.2 * trait + 0.18 * value + 0.12 * driver
}

export function rankCareers(scores) {
  return CAREER_LIBRARY
    .map((career, index) => ({ career, index, fit: careerFit(career, scores) }))
    .sort((a, b) => b.fit - a.fit || a.index - b.index)
}

export function deriveCareerMatches(scores, count = 5) {
  const ranked = rankCareers(scores)

  // Cap two picks per leading interest theme. Without it a strongly single-peaked
  // profile gets five variations of one job, which reads as no answer at all.
  const picked = []
  const perTheme = {}
  for (const entry of ranked) {
    const theme = entry.career.riasec[0]
    if ((perTheme[theme] ?? 0) >= 2) continue
    perTheme[theme] = (perTheme[theme] ?? 0) + 1
    picked.push(entry)
    if (picked.length === count) break
  }
  // Top up in plain rank order if the cap starved the list.
  for (const entry of ranked) {
    if (picked.length >= count) break
    if (!picked.includes(entry)) picked.push(entry)
  }
  return picked.slice(0, count).map((entry) => entry.career.title)
}

// Strength phrasing keyed to what the taker actually scored. The low-score
// variants are deliberate: a below-midpoint trait is still real information, and
// the report should say something true about it rather than flattening everyone
// into the same three compliments.
const TRAIT_STRENGTH_HIGH = {
  O: 'Generates and connects ideas rather than working only from precedent',
  C: 'Follows through reliably once a commitment is made',
  E: 'Builds momentum and brings other people into the work',
  A: 'Earns trust quickly and keeps working relationships intact',
  ES: 'Stays steady and clear-headed when pressure rises',
}
const TRAIT_STRENGTH_LOW = {
  O: 'Keeps work anchored to methods already proven to work',
  C: 'Stays flexible instead of over-committing to a fixed plan',
  E: 'Sustains long stretches of focused, low-interruption work',
  A: 'Holds a position under social pressure instead of conceding it',
  ES: 'Reads risk early and takes emerging problems seriously',
}
const INTEREST_STRENGTH = {
  R: 'Comfortable turning a plan into something physical and working',
  I: 'Breaks ambiguous problems down until the evidence is clear',
  A: 'Produces original work rather than variations on a template',
  S: 'Notices what people need and acts on it',
  E: 'Moves decisions, and people, toward an outcome',
  C: 'Brings order to information and processes others let drift',
}
const DRIVER_STRENGTH = {
  Mastery: 'Deepens skill deliberately instead of drifting between tools',
  Advancement: 'Aims at the next level and plans backwards from it',
  Teamwork: 'Raises the output of the group, not only your own',
  Purpose: 'Sustains effort when the work matters beyond the pay',
  'Financial Reward': 'Keeps a clear, unsentimental read on commercial value',
  Adaptability: 'Recovers quickly when the plan changes mid-flight',
}

export function deriveKeyStrengths(scores) {
  const { bf, ri, mv } = scores
  const [trait1, trait2] = getTop(bf, 2)
  const [topInterest] = getTop(ri, 1)
  const [topDriver] = getTop(mv, 1)
  const phrase = (factor) => ((bf[factor] ?? 3) >= 3 ? TRAIT_STRENGTH_HIGH[factor] : TRAIT_STRENGTH_LOW[factor])
  return [
    phrase(trait1),
    phrase(trait2),
    INTEREST_STRENGTH[topInterest],
    DRIVER_STRENGTH[topDriver],
  ].filter(Boolean)
}

// 36 identity labels off the top two interest themes, so the headline carries
// information instead of repeating one of six words.
const HEADLINE_NOUN = { R: 'Builder', I: 'Analyst', A: 'Originator', S: 'Connector', E: 'Driver', C: 'Organiser' }
const HEADLINE_MODIFIER = { R: 'Hands-On', I: 'Evidence-Led', A: 'Inventive', S: 'People-Centred', E: 'Commercially Minded', C: 'Structured' }

export function deriveHeadline(hollandCode) {
  const noun = HEADLINE_NOUN[hollandCode?.[0]]
  if (!noun) return 'Adaptive Profile'
  const modifier = HEADLINE_MODIFIER[hollandCode[1]]
  return modifier ? `${modifier} ${noun}` : noun
}

// Deterministic narrative, no LLM. Used both as the row's initial content
// (persisted before OpenRouter is ever called) and as the client's own
// last-ditch render if the edge function is unreachable.
export function buildFallbackReport(scores) {
  const { bf, ri, hollandCode, topValues, topMotivators } = scores
  const traits = getTop(bf, 2).map((key) => BF_LABELS[key])
  const interests = getTop(ri, 3).map((key) => RI_LABELS[key])
  const careerMatches = deriveCareerMatches(scores)
  return {
    headline: deriveHeadline(hollandCode),
    tagline: `A ${interests[0]?.toLowerCase() || 'balanced'} pattern, strongest where ${(topValues[0] || 'achievement').toLowerCase()} and ${(topMotivators[0] || 'mastery').toLowerCase()} are built into the work.`,
    personalitySummary: `Your personality pattern is led by ${traits.join(' and ')}. That suggests a work style shaped by how you think, organise yourself, and respond to people or pressure.`,
    careerInterestSummary: `Your strongest interest themes are ${interests.join(', ')}. You are likely to engage most in work that lets those preferences overlap in real tasks.`,
    valuesSummary: `Your strongest work values are ${topValues.join(', ')}. Those conditions are likely to matter a lot for your long-term satisfaction.`,
    motivationSummary: `Your strongest motivators are ${topMotivators.join(' and ')}. Work becomes easier to sustain when those drivers are built into the environment.`,
    integratedInsight: `Taken together, your profile suggests a mix of ${traits.join(' and ')} supported by a ${interests.join(', ')} interest pattern. Scored against the occupation set, the closest fits are ${careerMatches.slice(0, 2).join(' and ')} — not because of a job title you already had in mind, but because those roles draw on your strongest interest themes while supplying ${(topValues[0] || 'achievement').toLowerCase()} and ${(topMotivators[0] || 'mastery').toLowerCase()}. The next useful step is testing one of those environments in practice.`,
    careerMatches,
    keyStrengths: deriveKeyStrengths(scores),
    developmentNote: `Your growth edge is turning insight into experiments. Your lowest-scoring interest theme is ${RI_LABELS[getTop(ri, 6)[5]]}, so avoid judging yourself against roles built on it. Try short projects, internships, or role shadowing in the directions above to see which one actually holds up.`,
  }
}

// Section-level micro-insight paid out at each gamified unlock (Beat 2). Uses
// only the answers submitted so far for that section — deliberately partial
// and low-stakes, never presented as the final scored profile.
export function microInsightForSection(sectionId, responses) {
  if (sectionId === 'bigfive') {
    const bf = scoreBigFive(responses)
    const [top] = getTop(bf, 1)
    return `You lean ${BF_LABELS[top]}.`
  }
  if (sectionId === 'riasec') {
    const ri = scoreRIASEC(responses)
    const [top] = getTop(ri, 1)
    return `Your strongest interest theme is ${RI_LABELS[top]}.`
  }
  if (sectionId === 'values') {
    const wv = scoreValues(responses)
    const [top] = getTop(wv, 1)
    return `${top} stands out as a core work value for you.`
  }
  if (sectionId === 'motivation') {
    const mv = scoreMotivation(responses)
    const [top] = getTop(mv, 1)
    return `${top} is what drives you most.`
  }
  return ''
}
