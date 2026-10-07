// Run: node src/lib/recommendCourses.test.mjs
import assert from 'node:assert/strict'
import { recommendCourses, startingLevelFor, pickTarget } from './recommendCourses.js'

const SUBS = ['s1', 's2', 's3', 's4']
function result(level, points) {
  return {
    skill: 'sk', level,
    subskills: SUBS.map((id, i) => ({
      id, label: `Sub ${id}`, points: points[i],
      band: points[i] >= 7 ? 'strength' : points[i] >= 4 ? 'solid' : 'develop',
    })),
  }
}
let n = 0
function course(sub, levels, extra = {}) {
  n += 1
  return {
    skill_slug: 'sk', subskill_ids: Array.isArray(sub) ? sub : [sub], levels, title: `Course ${n}`,
    provider: `P${n}`, url: `https://host${n}.example/c${n}`, cost: 'free', format: 'course',
    active: true, link_state: 'ok', sort_weight: 0, is_thriveabl: false, ...extra,
  }
}

// ---- starting levels ----
assert.equal(startingLevelFor('proficient', 'develop'), 'foundational')
assert.equal(startingLevelFor('proficient', 'solid'), 'proficient')
assert.equal(startingLevelFor('proficient', 'strength'), 'advanced')
assert.equal(startingLevelFor('emerging', 'develop'), 'emerging', 'floor at emerging')
assert.equal(startingLevelFor('advanced', 'strength'), 'advanced', 'cap at advanced')

// ---- target ----
assert.equal(pickTarget(result('proficient', [9, 2, 6, 6]).subskills).target.id, 's2')
assert.equal(pickTarget(result('proficient', [9, 2, 6, 6]).subskills).stretch, false)
assert.equal(pickTarget(result('advanced', [9, 8, 9, 9]).subskills).target.id, 's2')
assert.equal(pickTarget(result('advanced', [9, 8, 9, 9]).subskills).stretch, true, 'no develop area -> stretch')

// ---- weakest subskill wins, at the right level ----
{
  const r = result('proficient', [9, 2, 6, 6]) // s2 is Develop -> starts Foundational
  const courses = [
    course('s2', ['foundational']), // exact: target + level fit
    course('s2', ['advanced']),     // wrong level for s2 -> excluded
    course('s1', ['advanced']),     // s1 is a Strength -> starts Advanced; lower fit
    course('s3', ['proficient']),
  ]
  const out = recommendCourses(r, courses)
  assert.equal(out.top[0].course, courses[0], 'target subskill at its starting level ranks first')
  assert.ok(!out.top.some((t) => t.course === courses[1]) && !Object.values(out.more).flat().some((t) => t.course === courses[1]),
    'advanced-only course for a Develop subskill must be excluded')
  assert.match(out.top[0].why, /Targets your biggest gap: Sub s2/)
  assert.match(out.top[0].why, /Foundational level/)
}

// ---- adjacent level allowed, two-away not ----
{
  const r = result('proficient', [6, 6, 6, 6]) // all Solid -> start Proficient
  const adjacent = course('s1', ['advanced'])
  const far = course('s1', ['emerging'])
  const out = recommendCourses(r, [adjacent, far])
  const all = [...out.top, ...Object.values(out.more).flat()].map((t) => t.course)
  assert.ok(all.includes(adjacent))
  assert.ok(!all.includes(far))
}

// ---- stretch framing when nothing is a development area ----
{
  const r = result('advanced', [9, 8, 9, 9])
  const out = recommendCourses(r, [course('s2', ['advanced']), course('s2', ['advanced']), course('s1', ['advanced']), course('s3', ['advanced'])])
  assert.ok(out.top.length === 3, 'an all-strong result still gets 3 courses')
  assert.match(out.top[0].why, /stretch/i)
}

// ---- exclusions ----
{
  const r = result('foundational', [2, 6, 6, 6])
  const inactive = course('s1', ['emerging'], { active: false })
  const broken = course('s1', ['emerging'], { link_state: 'broken' })
  const unknown = course('s1', ['emerging'], { link_state: 'unknown' })
  const otherSkill = course('s1', ['emerging'], { skill_slug: 'other' })
  const out = recommendCourses(r, [inactive, broken, unknown, otherSkill])
  const all = [...out.top, ...Object.values(out.more).flat()].map((t) => t.course)
  assert.deepEqual(all, [unknown], 'only the unknown-state, active, same-skill course remains')
}

// ---- provider diversity in the top 3 ----
{
  const r = result('foundational', [2, 6, 6, 6])
  const sameHost = (i) => course('s1', ['emerging'], { url: `https://same.example/c${i}` })
  const a = sameHost(1); const b = sameHost(2); const c = sameHost(3)
  const d = course('s1', ['emerging']); const e = course('s1', ['emerging'])
  const out = recommendCourses(r, [a, b, c, d, e])
  const hosts = out.top.map((t) => new URL(t.course.url).host)
  assert.equal(new Set(hosts).size, 3, 'top 3 come from 3 different hosts when available')
}

// ---- own coaching shown at most once ----
{
  const r = result('foundational', [2, 6, 6, 6])
  const own1 = course('s1', ['emerging'], { is_thriveabl: true, sort_weight: 9 })
  const own2 = course('s1', ['emerging'], { is_thriveabl: true, sort_weight: 9 })
  const out = recommendCourses(r, [own1, own2, course('s1', ['emerging']), course('s1', ['emerging'])])
  assert.equal(out.top.filter((t) => t.course.is_thriveabl).length, 1)
}

// ---- cost preference and sort_weight ----
{
  const r = result('foundational', [2, 6, 6, 6])
  const paid = course('s1', ['emerging'], { cost: 'paid' })
  const free = course('s1', ['emerging'], { cost: 'free' })
  const out = recommendCourses(r, [paid, free])
  assert.equal(out.top[0].course, free, 'free outranks paid at equal fit')
  const w1 = course('s1', ['emerging'], { sort_weight: 5 })
  const w0 = course('s1', ['emerging'], { sort_weight: 0 })
  assert.equal(recommendCourses(r, [w0, w1]).top[0].course, w1, 'sort_weight breaks ties')
}

// ---- empty catalog ----
{
  const out = recommendCourses(result('foundational', [2, 6, 6, 6]), [])
  assert.deepEqual(out.top, [])
  assert.deepEqual(out.more, {})
}

// ---- more[] groups the rest by subskill, none duplicated from top ----
{
  const r = result('foundational', [2, 5, 6, 6])
  const courses = [
    ...Array.from({ length: 6 }, () => course('s1', ['emerging'])),
    ...Array.from({ length: 3 }, () => course('s2', ['foundational'])),
  ]
  const out = recommendCourses(r, courses)
  assert.equal(out.top.length, 3)
  const moreAll = Object.values(out.more).flat()
  assert.equal(moreAll.length, courses.length - 3)
  assert.ok(moreAll.every((m) => !out.top.includes(m)))
  assert.ok(Object.keys(out.more).every((k) => SUBS.includes(k)))
}

console.log('recommendCourses tests passed')
