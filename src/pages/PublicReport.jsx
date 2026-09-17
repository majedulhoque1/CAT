import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ReportView from '../components/ReportView'
import { submissionRowToReportData } from '../lib/assessment'

// The durable version of a report — same data get_report_by_token (0012)
// returns, mapped through the same submissionRowToReportData() the admin
// detail view uses, so this is never a second implementation of the render.
// Not readOnly: this is the taker's own copy, so download/share/booking CTAs
// stay live here (unlike the admin's readOnly view of someone else's data).
export default function PublicReport() {
  const { token } = useParams()
  const [state, setState] = useState({ loading: true, data: null, error: '' })

  useEffect(() => {
    let active = true
    // async IIFE so every setState runs after an await, not synchronously in
    // the effect body (react-hooks/set-state-in-effect) — same convention as
    // AdminDashboard.jsx.
    ;(async () => {
      if (!supabase || !token) {
        await Promise.resolve()
        if (active) setState({ loading: false, data: null, error: 'Missing configuration.' })
        return
      }
      const { data, error } = await supabase.rpc('get_report_by_token', { p_token: token })
      if (!active) return
      if (error || !data) {
        setState({ loading: false, data: null, error: 'This report link is no longer valid.' })
        return
      }
      const mapped = submissionRowToReportData(data)
      mapped.reportToken = token
      setState({ loading: false, data: mapped, error: '' })
    })()
    return () => { active = false }
  }, [token])

  // Belt-and-braces alongside robots.txt's Disallow: /r/ — a search engine
  // indexing someone's psychometric profile is a headline.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta)
  }, [])

  return (
    <div className="wrap surface-paper app">
      {state.loading && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--sp-96)' }}>
          <div className="spinner" />
        </div>
      )}
      {!state.loading && state.error && (
        <div className="fu">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Report</p>
          <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>{state.error}</h1>
        </div>
      )}
      {!state.loading && state.data && <ReportView data={state.data} />}
    </div>
  )
}
