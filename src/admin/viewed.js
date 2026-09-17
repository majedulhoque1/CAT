// Tracks which submissions the admin has opened, in localStorage. A submission
// not in this set shows a "NEW" badge. Per-browser (single-admin design).
const KEY = 'cat_admin_viewed_submissions'

export function getViewedSet() {
  try {
    const raw = localStorage.getItem(KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function markViewed(submissionId) {
  try {
    const set = getViewedSet()
    set.add(submissionId)
    localStorage.setItem(KEY, JSON.stringify([...set]))
  } catch {
    // localStorage unavailable — NEW badges just won't persist.
  }
}
