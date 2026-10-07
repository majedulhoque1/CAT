import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../components/MarketingLayout'
import LiquidButton from '../components/LiquidButton'
import { supabase } from '../supabaseClient'
import { listSkills } from '../lib/skillBanks'
import { loadReportToken } from '../lib/progress'
import { loadSkillToken } from '../lib/skillProgress'

const RIASEC_WORD = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' }

export default function SkillsIndex() {
  const skills = listSkills()
  // The visitor's own Career Assessment result, if this browser has one. Used
  // only to mark which skills line up with their interests; it never gates anything.
  const [holland, setHolland] = useState('')

  useEffect(() => {
    const token = loadReportToken()
    if (!token || !supabase) return undefined
    let active = true
    ;(async () => {
      await Promise.resolve()
      const { data } = await supabase.rpc('get_report_by_token', { p_token: token })
      if (active && data?.holland_code) setHolland(String(data.holland_code))
    })()
    return () => { active = false }
  }, [])

  const letters = holland.split('')

  return (
    <MarketingLayout>
      <div className="mkt">
        <section className="sec">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-24)' }}>Skill Assessment</p>
          <h1 className="display-fluid" style={{ marginBottom: 'var(--sp-32)', maxWidth: '16ch' }}>
            How capable are you at a skill, right now?
          </h1>
          <p className="body measure" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)' }}>
            Short scenario-based tests. You get a level, a breakdown by subskill, the patterns holding you back,
            and courses matched to your gaps.
          </p>
          <div className="meta-row">
            <span className="meta-chip">20 questions</span>
            <span className="meta-chip">About 14 min each</span>
            <span className="meta-chip">Free</span>
          </div>
        </section>

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="sec-head"><p className="eyebrow">Choose a skill</p></div>
          <div className="skill-cards">
            {skills.map((s) => {
              const overlap = letters.filter((l) => s.riasecAffinity.includes(l))
              const last = loadSkillToken(s.slug)
              return (
                <article key={s.slug} className="skill-card">
                  <div className="skill-card-top">
                    <h2 className="sec-title">{s.title}</h2>
                    {overlap.length > 0 && (
                      <span className="meta-chip" title={`Your Career Assessment interests: ${letters.map((l) => RIASEC_WORD[l]).join(', ')}`}>
                        Fits your profile
                      </span>
                    )}
                  </div>
                  <p className="body" style={{ color: 'var(--muted)', margin: 'var(--sp-8) 0 var(--sp-16)' }}>{s.summary}</p>
                  <ul className="plain-list caption" style={{ marginBottom: 'var(--sp-24)' }}>
                    {s.subskills.map((x) => <li key={x.id}>{x.label}</li>)}
                  </ul>
                  <LiquidButton to={`/skills/${s.slug}`}>Take this test →</LiquidButton>
                  {last && (
                    <p className="caption" style={{ marginTop: 'var(--sp-16)' }}>
                      <Link to={`/s/${last}`} className="link-signal">View your last result<span className="arw" aria-hidden="true">→</span></Link>
                    </p>
                  )}
                </article>
              )
            })}
          </div>
          {!holland && (
            <p className="caption" style={{ marginTop: 'var(--sp-32)' }}>
              Not sure which skill matters most for you?{' '}
              <Link to="/" className="link-signal">Start with the Career Assessment<span className="arw" aria-hidden="true">→</span></Link>
            </p>
          )}
        </section>

        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="sec-head"><p className="eyebrow">How it works</p></div>
          <div className="measure">
            {[
              ['Rate yourself first', 'You rate each subskill before you start, so the report can compare what you expected with what the questions showed.'],
              ['Answer scenario questions', 'Each question has one best answer, from easy to hard. There is no time limit, and there are no trick questions.'],
              ['Get a level, not a percentage', 'Your level comes from which difficulty tiers you passed. Subskills are shown as indicative bands, because five questions can only point in a direction.'],
              ['Know the limits', 'This shows what you know about applying a skill, not how you perform at work. Levels are provisional and this is not a certificate.'],
            ].map(([q, a], i, arr) => (
              <div key={q} style={{ padding: 'var(--sp-24) 0', borderBottom: i < arr.length - 1 ? '1px solid var(--rule)' : 'none' }}>
                <p className="body" style={{ fontWeight: 500, marginBottom: 'var(--sp-8)' }}>{q}</p>
                <p className="caption">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
