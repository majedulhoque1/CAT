import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SkillResultView from '../components/skill/SkillResultView'
import { getSkillMeta } from '../lib/skillBanks'
import { describeError } from '../lib/describeError'

// /s/:token — the private, shareable skill report. Reads through the
// token-scoped get_skill_report_by_token RPC, which returns the scored snapshot
// and the first name only (no email, no raw answers, no keys).
export default function SkillPublicReport() {
  const { token } = useParams()
  const [state, setState] = useState({ status: 'loading', report: null, error: '' })

  useEffect(() => {
    let active = true
    ;(async () => {
      await Promise.resolve()
      if (!supabase) { if (active) setState({ status: 'error', report: null, error: 'Missing Supabase configuration in .env.' }); return }
      const { data, error } = await supabase.rpc('get_skill_report_by_token', { p_token: token })
      if (!active) return
      if (error) setState({ status: 'error', report: null, error: describeError(error) })
      else if (!data) setState({ status: 'missing', report: null, error: '' })
      else setState({ status: 'ok', report: data, error: '' })
    })()
    return () => { active = false }
  }, [token])

  const meta = state.report ? getSkillMeta(state.report.skill_slug) : null

  return (
    <div className="wrap surface-paper app">
      {state.status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}><div className="spinner" /></div>
      )}
      {state.status === 'missing' && (
        <div className="fu">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Report not found</p>
          <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>We could not find that report.</h1>
          <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)' }}>The link may be incomplete, or the report may have been removed.</p>
          <Link to="/skills" className="link-signal">Take a skill test<span className="arw" aria-hidden="true">→</span></Link>
        </div>
      )}
      {state.status === 'error' && (
        <div className="fu">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Something went wrong</p>
          <div className="panel" role="alert"><p className="caption">{state.error}</p></div>
        </div>
      )}
      {state.status === 'ok' && state.report && (
        <SkillResultView
          result={state.report.result}
          skillTitle={meta?.title || state.report.skill_slug}
          firstName={state.report.first_name}
          attemptNo={state.report.attempt_no}
        />
      )}
    </div>
  )
}
