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

// Deterministic narrative, no LLM. Used both as the row's initial content
// (persisted before OpenRouter is ever called) and as the client's own
// last-ditch render if the edge function is unreachable.
export function buildFallbackReport(scores) {
  const { bf, ri, hollandCode, topValues, topMotivators } = scores
  const traits = getTop(bf, 2).map((key) => BF_LABELS[key])
  const interests = getTop(ri, 3).map((key) => RI_LABELS[key])
  return {
    headline: `${RI_LABELS[hollandCode[0]] || 'Adaptive'} Profile`,
    tagline: `A ${interests[0]?.toLowerCase() || 'balanced'} pattern with clear intrinsic drivers.`,
    personalitySummary: `Your personality pattern is led by ${traits.join(' and ')}. That suggests a work style shaped by how you think, organise yourself, and respond to people or pressure.`,
    careerInterestSummary: `Your strongest interest themes are ${interests.join(', ')}. You are likely to engage most in work that lets those preferences overlap in real tasks.`,
    valuesSummary: `Your strongest work values are ${topValues.join(', ')}. Those conditions are likely to matter a lot for your long-term satisfaction.`,
    motivationSummary: `Your strongest motivators are ${topMotivators.join(' and ')}. Work becomes easier to sustain when those drivers are built into the environment.`,
    integratedInsight: `Taken together, your profile suggests a mix of ${traits.join(' and ')} supported by a ${interests.join(', ')} interest pattern. You are likely to do best where your preferred way of working, your values, and your motivation all reinforce each other. The next useful step is testing environments that fit this combination in practice.`,
    careerMatches: ['Research associate', 'Program coordinator', 'People operations specialist', 'Strategy support analyst', 'Learning and development associate'],
    keyStrengths: ['Clear motivational drivers', 'Strong interest-based fit signals', 'Healthy awareness of work values'],
    developmentNote: 'Your growth edge is turning insight into experiments. Try short projects, internships, or role shadowing to see which environments actually match your profile.',
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
