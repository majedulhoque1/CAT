import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { recommendCourses } from '../../lib/recommendCourses'
import { describeError } from '../../lib/describeError'

const COST_LABEL = { free: 'Free', free_audit: 'Free to audit', paid: 'Paid' }
const FORMAT_LABEL = { course: 'Course', video: 'Video', article: 'Article', book: 'Book', coaching: 'Coaching' }

// The URL is rendered into an href on a public page. The database also enforces
// https, but a link is only ever emitted from here after re-checking it.
function safeHref(url) {
  return typeof url === 'string' && /^https:\/\/[^\s]+$/.test(url) ? url : null
}

function meta(c) {
  const bits = [c.provider, FORMAT_LABEL[c.format] || c.format, COST_LABEL[c.cost] || c.cost]
  if (c.duration_hours) {
    bits.push(c.duration_hours < 1 ? `about ${Math.max(1, Math.round(c.duration_hours * 60))} min` : `about ${c.duration_hours} h`)
  }
  return bits.join(' · ')
}

function CourseRow({ entry }) {
  const { course, why } = entry
  const href = safeHref(course.url)
  return (
    <li className="course-row">
      <div>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="course-title">
            {course.title}<span className="arw" aria-hidden="true"> ↗</span>
          </a>
        ) : (
          <span className="course-title">{course.title}</span>
        )}
        <p className="caption mono">{meta(course)}</p>
        {why && <p className="caption" style={{ marginTop: 'var(--sp-4)' }}>{why}</p>}
      </div>
    </li>
  )
}

export default function CourseRecommendations({ result }) {
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    // async IIFE so setState runs after an await (react-hooks/set-state-in-effect)
    ;(async () => {
      await Promise.resolve()
      const { data, error: err } = await supabase
        .from('skill_courses')
        .select('id,skill_slug,subskill_ids,levels,title,provider,url,cost,format,duration_hours,is_thriveabl,active,sort_weight,link_state')
        .eq('skill_slug', result.skill)
      if (!active) return
      if (err) {
        setError(describeError(err))
        setCourses([])
      } else {
        setCourses(data || [])
      }
    })()
    return () => { active = false }
  }, [result.skill])

  const rec = useMemo(() => (courses ? recommendCourses(result, courses) : null), [courses, result])
  const labelFor = (id) => result.subskills.find((s) => s.id === id)?.label || id

  if (error) {
    return (
      <section className="skill-block">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Recommended courses</p>
        <p className="caption">Courses could not be loaded: {error}</p>
      </section>
    )
  }
  if (!rec || rec.top.length === 0) return null

  const moreGroups = Object.entries(rec.more).filter(([, list]) => list.length)

  return (
    <section className="skill-block">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Recommended courses</p>
      <h2 className="sec-title" style={{ marginBottom: 'var(--sp-8)' }}>
        {rec.stretch ? 'To stretch further' : 'To close your biggest gap'}
      </h2>
      <p className="caption" style={{ marginBottom: 'var(--sp-16)', maxWidth: 560 }}>
        Chosen for your result: your weakest area, at the level that suits you. Free options are listed first.
        We do not earn anything from these links.
      </p>
      <ol className="course-list">
        {rec.top.map((entry) => <CourseRow key={entry.course.id} entry={entry} />)}
      </ol>

      {moreGroups.length > 0 && (
        <details className="more-courses">
          <summary>More courses ({moreGroups.reduce((n, [, l]) => n + l.length, 0)})</summary>
          {moreGroups.map(([sid, list]) => (
            <div key={sid} style={{ marginTop: 'var(--sp-24)' }}>
              <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>{labelFor(sid)}</p>
              <ul className="course-list">
                {list.map((entry) => <CourseRow key={entry.course.id} entry={{ ...entry, why: null }} />)}
              </ul>
            </div>
          ))}
        </details>
      )}
    </section>
  )
}
