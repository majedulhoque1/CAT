// localStorage persistence for an in-progress assessment, so an abandoned run
// can resume instead of restarting. Cleared on successful submit.
const KEY = 'thriveabl_assessment_progress_v1'

export function saveProgress(responses, questionIndex) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ responses, questionIndex, savedAt: Date.now() }))
  } catch {
    // localStorage unavailable (private mode, quota) — resume is a nicety, not a requirement
  }
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.questionIndex !== 'number' || !parsed.responses) return null
    return parsed
  } catch {
    return null
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Completed-run state. Two separate concerns from the in-progress run above:
//
//   TOKEN_KEY  — the report token of the last completed assessment, so a
//                returning visitor's booking calendar unlocks silently instead
//                of demanding they retake a test they have already sat.
//   INTENT_KEY — why the current run was started, captured from ?intent=call
//                and held across a resumed session so a run begun three days
//                ago from the booking gate still lands in admin as call intent.
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'thriveabl_report_token_v1'
const INTENT_KEY = 'thriveabl_entry_intent_v1'

const VALID_INTENTS = ['self_serve', 'discovery_call']

export function saveReportToken(token) {
  try {
    if (typeof token === 'string' && token.length === 32) localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage unavailable — the emailed link is still the source of truth
  }
}

export function loadReportToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    // Length-check rather than trusting whatever is in storage: request_booking
    // rejects anything that isn't 32 chars, and a junk value would surface as a
    // confusing "invalid token" error instead of the locked-calendar state.
    return typeof token === 'string' && token.length === 32 ? token : null
  } catch {
    return null
  }
}

export function saveEntryIntent(intent) {
  try {
    if (VALID_INTENTS.includes(intent)) localStorage.setItem(INTENT_KEY, intent)
  } catch {
    // ignore
  }
}

export function loadEntryIntent() {
  try {
    const intent = localStorage.getItem(INTENT_KEY)
    return VALID_INTENTS.includes(intent) ? intent : 'self_serve'
  } catch {
    return 'self_serve'
  }
}

export function clearEntryIntent() {
  try {
    localStorage.removeItem(INTENT_KEY)
  } catch {
    // ignore
  }
}
