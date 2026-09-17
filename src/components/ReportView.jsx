import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { BF_LABELS, RI_LABELS, pct } from '../lib/assessment'
import { shareOrDownloadCard } from '../lib/shareCard'

// Monochrome scale bar: darkness never encodes category OR magnitude — length
// and the mono value do. Same ink on a grey track for every dimension.
function ScoreBar({ label, score }) {
  const [width, setWidth] = useState(0)
  const percentage = pct(score)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), 80)
    return () => clearTimeout(timer)
  }, [percentage])

  return (
    <div className="score-bar">
      <div className="score-label-row">
        <span className="score-label">{label}</span>
        <span className="score-value">{percentage}%</span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function ScarcityLine({ reportToken }) {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let active = true
    if (!supabase || !reportToken) return
    supabase.rpc('get_slot_summary').then(({ data, error }) => {
      if (!active || error || !data) return
      setSummary(data)
    })
    return () => { active = false }
  }, [reportToken])

  if (!summary || typeof summary.remaining !== 'number') return null
  return (
    <p className="caption mono" style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
      {summary.remaining} of {summary.capacity} discovery sessions left this week
    </p>
  )
}

// Shared report renderer used by both the taker flow (with actions/banners)
// and the admin/public detail view (readOnly hides taker-only actions).
export default function ReportView({ data, readOnly = false }) {
  const { parsed, bf, ri, top3R, topVals, topMot, source, scriptError, saveResult, reportToken } = data
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState('')

  function handlePrint() {
    window.print()
  }

  async function handleShare() {
    setShareBusy(true)
    setShareError('')
    try {
      await shareOrDownloadCard({
        hollandCode: top3R,
        headline: parsed.headline,
        siteOrigin: window.location.origin,
      })
    } catch (err) {
      setShareError(err?.message || 'Could not create the share card.')
    } finally {
      setShareBusy(false)
    }
  }

  return (
    <div className="fu">
      <div className="panel panel-inverted">
        <p className="eyebrow" style={{ color: 'var(--surface)', opacity: 0.6, marginBottom: 'var(--sp-16)' }}>Career Identity Report</p>
        <h1 className="hero-title" style={{ marginBottom: 'var(--sp-8)' }}>{parsed.headline}</h1>
        <p className="body" style={{ opacity: 0.82, fontStyle: 'italic', marginBottom: 'var(--sp-24)' }}>{parsed.tagline}</p>
        <p className="mono" style={{ letterSpacing: '4px', fontSize: 'var(--fs-20)' }}>{top3R}</p>
      </div>

      {source === 'fallback' && (
        <div className="panel">
          <p className="caption">
            {readOnly
              ? 'This report uses our deterministic scoring model — the AI narrative was not generated for this submission.'
              : `This report uses our deterministic scoring model. ${scriptError || ''}`}
          </p>
        </div>
      )}
      {!readOnly && saveResult?.ok === false && (
        <div className="panel">
          <p className="caption">Your report could not be saved: {saveResult.error}</p>
        </div>
      )}

      {!readOnly && (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-16)', marginBottom: 'var(--sp-16)' }}>
          <button className="btn-secondary" onClick={handlePrint}>Download / Print</button>
          <button className="btn-secondary" onClick={handleShare} disabled={shareBusy}>
            {shareBusy ? 'Preparing…' : 'Share your result'}
          </button>
        </div>
      )}
      {!readOnly && shareError && (
        <p className="caption" style={{ marginBottom: 'var(--sp-16)' }}>{shareError}</p>
      )}

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>01 &middot; Big Five Personality</p>
        {Object.entries(bf).sort((a, b) => b[1] - a[1]).map(([key, value]) => (
          <ScoreBar key={key} label={BF_LABELS[key]} score={value} />
        ))}
        <p className="body" style={{ marginTop: 'var(--sp-16)' }}>{parsed.personalitySummary}</p>
      </div>

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>02 &middot; RIASEC Career Interests</p>
        {Object.entries(ri).sort((a, b) => b[1] - a[1]).map(([key, value]) => (
          <ScoreBar key={key} label={RI_LABELS[key]} score={value} />
        ))}
        <p className="body" style={{ marginTop: 'var(--sp-16)' }}>{parsed.careerInterestSummary}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-16)' }}>
        <div className="panel">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Work Values</p>
          {topVals.map((value, index) => (
            <div key={value} className="row" style={{ display: 'flex', gap: 'var(--sp-8)', padding: 'var(--sp-8) 0' }}>
              <span className="mono caption">#{index + 1}</span>
              <span className="caption" style={{ color: 'var(--on-surface)' }}>{value}</span>
            </div>
          ))}
          <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>{parsed.valuesSummary}</p>
        </div>
        <div className="panel">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Motivation</p>
          {topMot.map((value, index) => (
            <div key={value} className="row" style={{ display: 'flex', gap: 'var(--sp-8)', padding: 'var(--sp-8) 0' }}>
              <span className="mono caption">#{index + 1}</span>
              <span className="caption" style={{ color: 'var(--on-surface)' }}>{value}</span>
            </div>
          ))}
          <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>{parsed.motivationSummary}</p>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Integrated Career Portrait</p>
        <p className="body">{parsed.integratedInsight}</p>
      </div>

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Suggested Career Directions</p>
        {parsed.careerMatches.map((match) => (
          <div key={match} className="row" style={{ display: 'flex', gap: 'var(--sp-8)', padding: 'var(--sp-8) 0' }}>
            <span style={{ width: 4, height: 4, background: 'var(--on-surface)', flexShrink: 0 }} />
            <span className="body">{match}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Key Strengths</p>
        {parsed.keyStrengths.map((strength, index) => (
          <div key={strength} style={{ display: 'flex', gap: 'var(--sp-16)', marginBottom: 'var(--sp-16)' }}>
            <span className="mono caption">0{index + 1}</span>
            <p className="body" style={{ flex: 1 }}>{strength}</p>
          </div>
        ))}
      </div>

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Growth Edge</p>
        <p className="body">{parsed.developmentNote}</p>
      </div>

      {!readOnly && reportToken && (
        <div className="no-print" style={{ marginTop: 'var(--sp-32)' }}>
          <p className="caption mono" style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>Priority booking unlocked</p>
          <ScarcityLine reportToken={reportToken} />
          <Link to={`/book?r=${reportToken}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="btn-cta">Book your free 30-min session →</div>
          </Link>
        </div>
      )}
    </div>
  )
}
