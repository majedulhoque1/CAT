import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseRecommendations from './CourseRecommendations'

const LEVELS = [
  { id: 'advanced', label: 'Advanced' },
  { id: 'proficient', label: 'Proficient' },
  { id: 'foundational', label: 'Foundational' },
  { id: 'emerging', label: 'Emerging' },
]
const BAND_WORD = { develop: 'Develop', solid: 'Solid', strength: 'Strength' }
const BAND_CALIBRATION = {
  accurate: 'Your estimate matched the result.',
  'over-estimate': 'You rated yourself higher than the questions showed.',
  'under-estimate': 'You rated yourself lower than the questions showed.',
}

function SubskillBar({ sub }) {
  const [width, setWidth] = useState(0)
  const target = Math.round((sub.points / sub.maxPoints) * 100)
  useEffect(() => {
    const t = setTimeout(() => setWidth(target), 80)
    return () => clearTimeout(t)
  }, [target])

  return (
    <div className="score-bar">
      <div className="score-label-row">
        <span className="score-label">{sub.label}</span>
        <span className="score-value">{BAND_WORD[sub.band]}</span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${width}%` }} />
      </div>
      <p className="caption mono" style={{ marginTop: 'var(--sp-4)' }}>
        {sub.correct} of {sub.n} correct &middot; indicative
      </p>
    </div>
  )
}

// Renders a scored skill result. Used for the live result, the shareable /s/:token
// page and (readOnly) the admin detail. It only ever receives the public `result`
// snapshot, which carries no answer keys.
export default function SkillResultView({ result, skillTitle, firstName, attemptNo, readOnly = false }) {
  const evidence = [
    `${result.totalCorrect} of ${result.totalItems} correct`,
    result.consistency === 'mixed' ? 'mixed pattern' : 'consistent pattern',
    attemptNo > 1 ? `attempt ${attemptNo}` : null,
  ].filter(Boolean).join(' · ')

  const weak = result.weaknesses || []

  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>
        {firstName ? `${firstName}'s ` : ''}Skill report &middot; {skillTitle}
      </p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-8)' }}>{result.levelLabel}</h1>
      <p className="body" style={{ marginBottom: 'var(--sp-24)', maxWidth: 560 }}>{result.canDo}</p>

      {/* ---- level ladder ---- */}
      <div className="ladder" role="img" aria-label={`Level: ${result.levelLabel}`}>
        {LEVELS.map((l) => (
          <div key={l.id} className={`ladder-rung${result.level === l.id ? ' current' : ''}`}>
            <span className="mono">{l.label}</span>
            {result.level === l.id && <span className="mono">You are here</span>}
          </div>
        ))}
      </div>
      <p className="caption mono" style={{ margin: 'var(--sp-8) 0 var(--sp-32)' }}>{evidence}</p>

      {result.consistency === 'mixed' && (
        <div className="gate-note">
          <p className="caption">
            Your answers did not follow the usual easy-to-hard pattern, for example some harder questions
            right while some easier ones were missed. Treat this level as approximate.
          </p>
        </div>
      )}
      {result.lowEffort && (
        <div className="gate-note">
          <p className="caption">
            Parts of this test were answered very quickly or in a repeated pattern, so the result may not
            reflect what you can do. Retaking it more slowly would give a better picture.
          </p>
        </div>
      )}

      {/* ---- subskills ---- */}
      <section className="skill-block">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Subskills</p>
        {result.subskills.map((s) => <SubskillBar key={s.id} sub={s} />)}
        <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>
          Each subskill rests on only 5 questions, so read these as a direction, not a precise score.
        </p>
      </section>

      {/* ---- self vs measured ---- */}
      <section className="skill-block">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>What you expected and what we found</p>
        <div className="calib">
          {result.subskills.map((s) => (
            <div key={s.id} className="calib-row">
              <div>
                <p className="body" style={{ fontWeight: 500 }}>{s.label}</p>
                <p className="caption">{BAND_CALIBRATION[s.calibration]}</p>
              </div>
              <p className="caption mono calib-vals">
                You: {BAND_WORD[s.selfBand]}<br />Measured: {BAND_WORD[s.band]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- strengths ---- */}
      {result.strengths.length > 0 && (
        <section className="skill-block">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Strengths</p>
          <p className="body">
            {result.strengths.map((id) => result.subskills.find((s) => s.id === id)?.label).join(', ')}
          </p>
        </section>
      )}

      {/* ---- misconceptions ---- */}
      {weak.length > 0 && (
        <section className="skill-block">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Patterns to work on</p>
          {weak.map((w) => (
            <div key={w.subskill} style={{ marginBottom: 'var(--sp-24)' }}>
              <p className="body" style={{ fontWeight: 500, marginBottom: 'var(--sp-8)' }}>{w.label}</p>
              <ul className="plain-list">
                {w.misconceptions.map((m) => (
                  <li key={m.tag}>
                    <span style={{ fontWeight: 500 }}>{m.label}.</span>{' '}
                    <span className="caption">{m.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* ---- next steps ---- */}
      <section className="skill-block">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Your next steps</p>
        {result.nextSteps.map((n) => (
          <div key={n.subskill} style={{ marginBottom: 'var(--sp-16)' }}>
            <p className="body" style={{ fontWeight: 500 }}>
              {n.label} <span className="caption mono">&middot; {BAND_WORD[n.band]}</span>
            </p>
            <p className="caption">{n.text}</p>
          </div>
        ))}
      </section>

      <CourseRecommendations result={result} />

      {/* ---- scope note ---- */}
      <section className="skill-block">
        <p className="caption" style={{ maxWidth: 600 }}>
          About this result: it comes from 20 scenario questions and shows what you know about applying this
          skill. It does not show how you perform at work. Levels are provisional and will be refined as more
          people take the test. It is not a certificate.
        </p>
      </section>

      {!readOnly && (
        <div className="skill-actions no-print">
          <div className="gate-note">
            <p className="caption">
              Want to talk it through? A discovery session starts from the free Career Assessment, which
              gives the coach a fuller picture of you.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 'var(--sp-8)' }}>
            <Link to="/cat/take?intent=call" className="btn-cta" style={{ textDecoration: 'none' }}>
              Take the Career Assessment →
            </Link>
            <Link to="/skills" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Try another skill
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
