import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getViewedSet, markViewed } from './viewed'
import { downloadCSV } from './csv'
import AdminNav from './AdminNav'

// One source of truth — this list was previously duplicated between load() and
// the mount effect, so a new column had to be added in two places to appear.
const SELECT_COLUMNS =
  'submission_id, submitted_at, full_name, gmail, holland_code, headline, report_source, entry_intent'

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminDashboard({ session }) {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortNewest, setSortNewest] = useState(true)
  const [viewed, setViewed] = useState(() => getViewedSet())
  const [deletingId, setDeletingId] = useState('')
  const [intentFilter, setIntentFilter] = useState('all') // all | discovery_call | self_serve

  async function fetchRows() {
    const { data, error: loadError } = await supabase
      .from('assessment_submissions')
      .select(SELECT_COLUMNS)
      .order('submitted_at', { ascending: false })
      .limit(500)
    if (loadError) {
      setError(loadError.message)
      setRows([])
    } else {
      setRows(data || [])
    }
    setLoading(false)
  }

  async function load() {
    setLoading(true)
    setError('')
    await fetchRows()
  }

  useEffect(() => {
    // loading starts true; only set state after the await so the effect body
    // performs no synchronous setState (react-hooks/set-state-in-effect).
    let active = true
    ;(async () => {
      const { data, error: loadError } = await supabase
        .from('assessment_submissions')
        .select(SELECT_COLUMNS)
        .order('submitted_at', { ascending: false })
        .limit(500)
      if (!active) return
      if (loadError) {
        setError(loadError.message)
        setRows([])
      } else {
        setRows(data || [])
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows
    if (q) {
      list = rows.filter(
        (r) =>
          (r.full_name || '').toLowerCase().includes(q) ||
          (r.gmail || '').toLowerCase().includes(q) ||
          (r.headline || '').toLowerCase().includes(q),
      )
    }
    if (intentFilter !== 'all') {
      // Rows written before 0017 have no value; treat them as self_serve so the
      // filter never silently hides history.
      list = list.filter((r) => (r.entry_intent || 'self_serve') === intentFilter)
    }
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.submitted_at).getTime()
      const tb = new Date(b.submitted_at).getTime()
      return sortNewest ? tb - ta : ta - tb
    })
    return sorted
  }, [rows, search, sortNewest, intentFilter])

  const newCount = useMemo(() => rows.filter((r) => !viewed.has(r.submission_id)).length, [rows, viewed])
  const callCount = useMemo(
    () => rows.filter((r) => r.entry_intent === 'discovery_call').length,
    [rows],
  )

  function openSubmission(id) {
    markViewed(id)
    setViewed(getViewedSet())
    navigate(`/admin/submissions/${id}`)
  }

  async function handleDelete(event, id) {
    event.stopPropagation()
    if (!window.confirm('Delete this submission and all its answers? This cannot be undone.')) return
    setDeletingId(id)
    const { error: delError } = await supabase.from('assessment_submissions').delete().eq('submission_id', id)
    setDeletingId('')
    if (delError) {
      window.alert(`Delete failed: ${delError.message}`)
      return
    }
    setRows((prev) => prev.filter((r) => r.submission_id !== id))
  }

  function handleExport() {
    const headers = ['Submitted At', 'Full Name', 'Gmail', 'Entry Intent', 'Holland Code', 'Headline', 'Report Source', 'Submission ID']
    const csvRows = filtered.map((r) => [
      formatDate(r.submitted_at),
      r.full_name,
      r.gmail,
      r.entry_intent === 'discovery_call' ? 'Wanted a call' : 'Assessment only',
      r.holland_code,
      r.headline,
      r.report_source,
      r.submission_id,
    ])
    downloadCSV(`assessments-${new Date().toISOString().slice(0, 10)}.csv`, headers, csvRows)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-24)', gap: 'var(--sp-16)', flexWrap: 'wrap' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Admin Portal</p>
          <h1 className="hero-title">Submissions</h1>
          <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>
            {rows.length} total{newCount > 0 ? ` · ${newCount} new` : ''}
            {callCount > 0 ? ` · ${callCount} wanted a call` : ''} · {session.user?.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
          <button className="a-btn" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button className="a-btn" onClick={handleExport} disabled={!filtered.length}>Export CSV</button>
          <button className="a-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-8)', marginBottom: 'var(--sp-16)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <input className="a-search" placeholder="Search name, Gmail, or headline…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="a-btn" onClick={() => setSortNewest((v) => !v)}>
          {sortNewest ? 'Newest first' : 'Oldest first'}
        </button>
        {[
          ['all', 'All'],
          ['discovery_call', 'Wanted a call'],
          ['self_serve', 'Assessment only'],
        ].map(([value, label]) => (
          <button
            key={value}
            className={`a-btn${intentFilter === value ? ' primary' : ''}`}
            onClick={() => setIntentFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="panel">
          <p className="caption">Could not load submissions: {error}</p>
        </div>
      )}

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p className="caption">{rows.length === 0 ? 'No submissions yet.' : 'No submissions match your search.'}</p>
          </div>
        ) : (
          filtered.map((r) => {
            const isNew = !viewed.has(r.submission_id)
            return (
              <div key={r.submission_id} className="a-list-row" onClick={() => openSubmission(r.submission_id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{r.full_name || 'Unnamed'}</span>
                    {isNew && <span className="a-badge new">New</span>}
                    {r.entry_intent === 'discovery_call' && (
                      <span className="a-badge intent">Wanted a call</span>
                    )}
                    {r.report_source === 'fallback' && <span className="a-badge fallback">Fallback</span>}
                  </div>
                  <div className="caption" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.gmail || '—'}{r.headline ? ` · ${r.headline}` : ''}
                  </div>
                </div>
                {r.holland_code && <span className="a-badge holland">{r.holland_code}</span>}
                <span className="caption" style={{ minWidth: 130, textAlign: 'right', flexShrink: 0 }}>{formatDate(r.submitted_at)}</span>
                <button
                  className="a-btn danger"
                  style={{ height: 34, padding: '0 12px', flexShrink: 0 }}
                  onClick={(e) => handleDelete(e, r.submission_id)}
                  disabled={deletingId === r.submission_id}
                >
                  {deletingId === r.submission_id ? '…' : 'Delete'}
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
