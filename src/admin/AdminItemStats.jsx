import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from './AdminNav'
import { listSkills } from '../lib/skillBanks'
import { describeError } from '../lib/describeError'
import { computeItemStats, MIN_N } from '../lib/itemStats'

const PAGE = 1000
const MAX_PAGES = 20

// PostgREST caps a response at 1000 rows, so page through explicitly.
async function fetchAllItems(skill) {
  const out = []
  for (let p = 0; p < MAX_PAGES; p += 1) {
    const { data, error } = await supabase
      .from('skill_assessment_response_items')
      .select('submission_id, bank_version, item_id, tier, subskill, correct')
      .eq('skill_slug', skill)
      .order('created_at', { ascending: true })
      .range(p * PAGE, (p + 1) * PAGE - 1)
    if (error) throw error
    out.push(...data)
    if (data.length < PAGE) break
  }
  return out
}

export default function AdminItemStats() {
  const skills = listSkills()
  const [skill, setSkill] = useState(skills[0].slug)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      await Promise.resolve()
      try {
        const data = await fetchAllItems(skill)
        if (!active) return
        setRows(data)
        setError('')
        const versions = [...new Set(data.map((r) => r.bank_version))].sort((a, b) => b - a)
        setVersion(versions[0] ?? null)
      } catch (err) {
        if (active) { setError(describeError(err)); setRows([]) }
      }
      if (active) setLoading(false)
    })()
    return () => { active = false }
  }, [skill])

  const versions = useMemo(() => [...new Set(rows.map((r) => r.bank_version))].sort((a, b) => b - a), [rows])
  const stats = useMemo(() => computeItemStats(rows.filter((r) => r.bank_version === version)), [rows, version])
  const sittings = useMemo(() => new Set(rows.filter((r) => r.bank_version === version).map((r) => r.submission_id)).size, [rows, version])

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Admin Portal</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-8)' }}>Question statistics</h1>
      <p className="caption" style={{ marginBottom: 'var(--sp-24)', maxWidth: 640 }}>
        Difficulty (share who answered correctly) and discrimination (does getting this right go with doing well on the rest?).
        Flags need at least {MIN_N} responses. Use them to find questions that are too easy, too hard or not separating strong from weak.
      </p>

      <div style={{ display: 'flex', gap: 'var(--sp-8)', marginBottom: 'var(--sp-16)', flexWrap: 'wrap' }}>
        {skills.map((s) => <button key={s.slug} className={`a-btn${skill === s.slug ? ' primary' : ''}`} onClick={() => { setLoading(true); setSkill(s.slug) }}>{s.title}</button>)}
        {versions.map((v) => <button key={v} className={`a-btn${version === v ? ' primary' : ''}`} onClick={() => setVersion(v)}>Version {v}</button>)}
      </div>

      {error && <div className="panel" role="alert"><p className="caption">{error}</p></div>}

      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : stats.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}><p className="caption">No responses yet.</p></div>
        ) : (
          <>
            <p className="caption mono" style={{ padding: 'var(--sp-16)' }}>{sittings} sittings{sittings < MIN_N ? ` — insufficient data (need ${MIN_N}+)` : ''}</p>
            <table className="stimulus-table">
              <thead><tr><th>Item</th><th>Tier</th><th>n</th><th>Correct</th><th>Discrimination</th><th>Flags</th></tr></thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.item_id}>
                    <td className="mono">{s.item_id}</td>
                    <td className="mono">{s.tier}</td>
                    <td className="mono">{s.n}</td>
                    <td className="mono">{Math.round(s.p * 100)}%</td>
                    <td className="mono">{s.rpb === null ? '—' : s.rpb.toFixed(2)}</td>
                    <td>{s.n < MIN_N ? <span className="caption">insufficient data</span> : s.flags.length ? s.flags.map((f) => <span key={f} className="a-badge fallback" style={{ marginRight: 4 }}>{f}</span>) : <span className="caption">ok</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
