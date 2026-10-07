// localStorage for the Skill Assessment, keyed PER SKILL so a run in one skill
// never touches another skill's progress or the Career Assessment's
// (thriveabl_assessment_progress_v1 in progress.js). Every call is wrapped:
// storage can be missing or full, and resume is a nicety, not a requirement.
const PROGRESS_PREFIX = 'thriveabl_skill_progress_v1:'
const TOKEN_PREFIX = 'thriveabl_skill_token_v1:'

export function saveSkillProgress(slug, state) {
  try {
    localStorage.setItem(PROGRESS_PREFIX + slug, JSON.stringify({ ...state, savedAt: Date.now() }))
  } catch {
    // ignore
  }
}

// Returns null if nothing is saved, it is malformed, or it was saved against a
// different bank version (the questions or keys may have changed under it).
export function loadSkillProgress(slug, bankVersion) {
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + slug)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p || p.bankVersion !== bankVersion) return null
    if (typeof p.index !== 'number' || !p.responses || !p.selfRatings || typeof p.seed !== 'number') return null
    return p
  } catch {
    return null
  }
}

export function clearSkillProgress(slug) {
  try {
    localStorage.removeItem(PROGRESS_PREFIX + slug)
  } catch {
    // ignore
  }
}

export function saveSkillToken(slug, token) {
  try {
    if (typeof token === 'string' && token.length === 32) localStorage.setItem(TOKEN_PREFIX + slug, token)
  } catch {
    // ignore
  }
}

export function loadSkillToken(slug) {
  try {
    const token = localStorage.getItem(TOKEN_PREFIX + slug)
    return typeof token === 'string' && token.length === 32 ? token : null
  } catch {
    return null
  }
}

// ---- seeded option order -----------------------------------------------------
// The display order of options is shuffled once per run and must be identical
// after a reload, so it is derived from a seed that is saved with the progress.
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function newSeed() {
  return Math.floor(Math.random() * 4294967295)
}

export function shuffledOptions(item, seed) {
  const rand = mulberry32((seed ^ hashString(item.id)) >>> 0)
  const out = [...item.options]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
