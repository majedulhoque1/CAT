import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { downloadCSV } from './csv'
import AdminNav from './AdminNav'
import { listSkills } from '../lib/skillBanks'
import { describeError } from '../lib/describeError'

const COLUMNS = 'submission_id, created_at, full_name, email, skill_slug, bank_version, attempt_no, level_label, total_correct, total_items, consistency, low_effort'

function formatDate(value) {
  return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

export default function AdminSkills() {
  const navigate = useNavigate()
  const skills = listSkills()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skill, setSkill] = useState('all')
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      await Promise.resolve()
      const { data, error: err } = await supabase
        .from('skill_assessment_submissions')
        .select(COLUMNS)
        .order('created_at', { ascending: false })
        .limit(500)
      if (!active) return
      if (err) { setError(describeError(err)); setRows([]) } else { setError(''); setRows(data || []) }
      setLoading(false)
    })()
    return () => { active = false }
  }, [tick])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) =>
      (skill === 'all' || r.skill_slug === skill) &&
      (!q || (r.full_name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q)))
  }, [rows, skill, search])

  const titleOf = (slug) => skills.find((s) => s.slug === slug)?.title || slug

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!window.confirm('Delete this skill submission and its answers? This cannot be undone.')) return
    setDeletingId(id)
    const { error: err } = await supabase.from('skill_assessment_submissions').delete().eq('submission_id', id)
    setDeletingId('')
    if (err) { setError(`Delete failed: ${describeError(err)}`); return }
    setRows((prev) => prev.filter((r) => r.submission_id !== id))
  }

  function handleExport() {
    downloadCSV(
      `skill-assessments-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Submitted At', 'Full Name', 'Email', 'Skill', 'Bank Version', 'Attempt', 'Level', 'Correct', 'Items', 'Consistency', 'Low Effort', 'Submission ID'],
      filtered.map((r) => [formatDate(r.created_at), r.full_name, r.email, titleOf(r.skill_slug), r.bank_version, r.attempt_no, r.level_label, r.total_correct, r.total_items, r.consistency, r.low_effort ? 'yes' : 'no', r.submission_id]),
    )
  }

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-24)', gap: 'var(--sp-16)', flexWrap: 'wrap' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Admin Portal</p>
          <h1 className="hero-title">Skill results</h1>
          <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>{rows.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
          <button className="a-btn" onClick={() => { setLoading(true); setTick((t) => t + 1) }} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button className="a-btn" onClick={handleExport} disabled={!filtered.length}>Export CSV</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-8)', marginBottom: 'var(--sp-16)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <input className="a-search" placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className={`a-btn${skill === 'all' ? ' primary' : ''}`} onClick={() => setSkill('all')}>All skills</button>
        {skills.map((s) => (
          <button key={s.slug} className={`a-btn${skill === s.slug ? ' primary' : ''}`} onClick={() => setSkill(s.slug)}>{s.title}</button>
        ))}
      </div>

      {error && <div className="panel" role="alert"><p className="caption">{error}</p></div>}

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}><p className="caption">{rows.length === 0 ? 'No skill results yet.' : 'No results match your filters.'}</p></div>
        ) : (
          filtered.map((r) => (
            <div key={r.submission_id} className="a-list-row" onClick={() => navigate(`/admin/skills/${r.submission_id}`)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{r.full_name || 'Unnamed'}</span>
                  {r.low_effort && <span className="a-badge fallback">Low effort</span>}
                  {r.consistency === 'mixed' && <span className="a-badge fallback">Mixed</span>}
                  {r.attempt_no > 1 && <span className="a-badge">Attempt {r.attempt_no}</span>}
                </div>
                <div className="caption" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.email} · {titleOf(r.skill_slug)} · v{r.bank_version}
                </div>
              </div>
              <span className="a-badge intent">{r.level_label}</span>
              <span className="caption mono" style={{ minWidth: 56, textAlign: 'right' }}>{r.total_correct}/{r.total_items}</span>
              <span className="caption" style={{ minWidth: 130, textAlign: 'right', flexShrink: 0 }}>{formatDate(r.created_at)}</span>
              <button className="a-btn danger" style={{ height: 34, padding: '0 12px', flexShrink: 0 }} onClick={(e) => handleDelete(e, r.submission_id)} disabled={deletingId === r.submission_id}>
                {deletingId === r.submission_id ? '…' : 'Delete'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
