// Course matching for the skill report. Pure: no network, no keys.
//
//   recommendCourses(result, courses) -> { top, more, target, stretch }
//
// A course's `levels` are the LEARNER STARTING levels it suits. Each subskill
// has its own starting level, derived from the overall level and that
// subskill's band, so a Proficient learner who is weak on one subskill is
// pointed at material for that subskill's level, not at advanced material.

export const LEVEL_IDS = ['emerging', 'foundational', 'proficient', 'advanced']
const LEVEL_LABEL = { emerging: 'Emerging', foundational: 'Foundational', proficient: 'Proficient', advanced: 'Advanced' }

export function startingLevelFor(overallLevel, band) {
  const idx = LEVEL_IDS.indexOf(overallLevel)
  const shift = band === 'develop' ? -1 : band === 'strength' ? 1 : 0
  return LEVEL_IDS[Math.min(LEVEL_IDS.length - 1, Math.max(0, idx + shift))]
}

function hostOf(url) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

// The subskill to prioritise: the lowest-scoring one. When nothing is a
// development area it is still the lowest, and the report frames it as a stretch.
export function pickTarget(subskills) {
  const sorted = [...subskills].sort((a, b) => a.points - b.points)
  const target = sorted[0]
  return { target, stretch: target.band !== 'develop' }
}

function scoreCourse(course, result, targetId, stretch) {
  let best = null
  for (const sub of result.subskills) {
    if (!course.subskill_ids.includes(sub.id)) continue
    const start = startingLevelFor(result.level, sub.band)
    const startIdx = LEVEL_IDS.indexOf(start)
    let levelFit = null
    if (course.levels.includes(start)) levelFit = 2
    else if (course.levels.some((l) => Math.abs(LEVEL_IDS.indexOf(l) - startIdx) === 1)) levelFit = 1
    if (levelFit === null) continue // too far from where this learner is

    const fit = sub.id === targetId ? 3 : sub.band !== 'strength' ? 2 : 1
    const score = fit + levelFit + (course.cost === 'paid' ? 0 : 1)
    if (!best || score > best.score) {
      const why = sub.id === targetId
        ? stretch
          ? `A stretch in your weakest area: ${sub.label}`
          : `Targets your biggest gap: ${sub.label}`
        : `Builds ${sub.label}`
      best = { course, score, forSubskill: sub.id, subskillLabel: sub.label, startLevel: start, why: `${why} · suits ${LEVEL_LABEL[start]} level` }
    }
  }
  return best
}

export function recommendCourses(result, courses, { topN = 3 } = {}) {
  const { target, stretch } = pickTarget(result.subskills)

  const scored = courses
    .filter((c) => c.active !== false && c.link_state !== 'broken' && c.skill_slug === result.skill)
    .map((c) => scoreCourse(c, result, target.id, stretch))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || (b.course.sort_weight || 0) - (a.course.sort_weight || 0) || a.course.title.localeCompare(b.course.title))

  // Top picks: at most one per host, and thriveABL's own offer at most once.
  const top = []
  const usedHosts = new Set()
  let usedOwn = false
  for (const s of scored) {
    if (top.length >= topN) break
    const host = hostOf(s.course.url)
    if (usedHosts.has(host)) continue
    if (s.course.is_thriveabl && usedOwn) continue
    top.push(s)
    usedHosts.add(host)
    if (s.course.is_thriveabl) usedOwn = true
  }
  // Fewer than topN distinct hosts available: fill without the host cap.
  for (const s of scored) {
    if (top.length >= topN) break
    if (!top.includes(s)) top.push(s)
  }

  const more = {}
  for (const s of scored) {
    if (top.includes(s)) continue
    ;(more[s.forSubskill] ||= []).push(s)
  }

  return { top, more, target, stretch }
}
