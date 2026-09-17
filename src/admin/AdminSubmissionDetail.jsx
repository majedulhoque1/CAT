import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ReportView from '../components/ReportView'
import { SECTIONS, submissionRowToReportData } from '../lib/assessment'
import { downloadCSV } from './csv'
import AdminNav from './AdminNav'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// Returns response items either from the stored response_items array or, as a
// fallback, reconstructed from SECTIONS + the flat responses map.
function normaliseResponses(row) {
  if (Array.isArray(row.response_items) && row.response_items.length) {
    return row.response_items
  }
  const responses = row.responses || {}
  return SECTIONS.flatMap((section) =>
    section.items.map((item, index) => ({
      id: item.id,
      sectionLabel: section.label,
      sectionTitle: section.title,
      questionOrder: index + 1,
      prompt: item.text,
      value: responses[item.id] ?? null,
    })),
  )
}

export default function AdminSubmissionDetail() {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  const [row, setRow] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function fetchRow() {
      setLoading(true)
      setError('')
      const { data, error: loadError } = await supabase
        .from('assessment_submissions')
        .select('*')
        .eq('submission_id', submissionId)
        .maybeSingle()
      if (!active) return
      if (loadError) {
        setError(loadError.message)
        setLoading(false)
        return
      }
      setRow(data)
      setLoading(false)

      // Cross-reference: has this candidate booked a call? bookings.details
      // carries a plain 'submission_id' key (0013), so this is a jsonb filter,
      // not a join — matches the "no schema change" pattern the kit relies on.
      const { data: bookingRows } = await supabase
        .from('bookings')
        .select('id, date, time, status')
        .eq('details->>submission_id', submissionId)
        .order('created_at', { ascending: false })
        .limit(1)
      if (active && bookingRows?.length) setBooking(bookingRows[0])
    }

    fetchRow()
    return () => {
      active = false
    }
  }, [submissionId])

  const responseItems = useMemo(() => (row ? normaliseResponses(row) : []), [row])

  const grouped = useMemo(() => {
    const map = new Map()
    responseItems.forEach((item) => {
      const key = item.sectionLabel || '—'
      if (!map.has(key)) map.set(key, { title: item.sectionTitle, items: [] })
      map.get(key).items.push(item)
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [responseItems])

  async function handleDelete() {
    if (!window.confirm('Delete this submission and all its answers? This cannot be undone.')) return
    const { error: delError } = await supabase.from('assessment_submissions').delete().eq('submission_id', submissionId)
    if (delError) {
      window.alert(`Delete failed: ${delError.message}`)
      return
    }
    navigate('/admin')
  }

  function handleExport() {
    const headers = ['Section', 'Question Order', 'Question ID', 'Prompt', 'Answer (1-5)']
    const csvRows = responseItems.map((item) => [
      item.sectionTitle,
      item.questionOrder,
      item.id,
      item.prompt,
      item.value,
    ])
    downloadCSV(`submission-${submissionId.slice(0, 8)}.csv`, headers, csvRows)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (error || !row) {
    return (
      <div className="wrap-wide">
        <AdminNav />
        <Link to="/admin" className="a-btn" style={{ display: 'inline-flex', alignItems: 'center', height: 40, marginBottom: 'var(--sp-16)' }}>← Back</Link>
        <div className="panel">
          <p className="caption">
            {error ? `Could not load submission: ${error}` : 'Submission not found (it may have been deleted).'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-16)', gap: 'var(--sp-8)', flexWrap: 'wrap' }}>
        <button className="a-btn" onClick={() => navigate('/admin')}>← Back to submissions</button>
        <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
          <button className="a-btn" onClick={handleExport}>Export answers CSV</button>
          <button className="a-btn danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Participant</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--sp-16)' }}>
          <div>
            <div className="caption">Full name</div>
            <div className="body" style={{ fontWeight: 500 }}>{row.full_name || '—'}</div>
          </div>
          <div>
            <div className="caption">Email</div>
            <div className="body" style={{ fontWeight: 500 }}>{row.gmail || '—'}</div>
          </div>
          <div>
            <div className="caption">Submitted</div>
            <div className="body" style={{ fontWeight: 500 }}>{formatDate(row.submitted_at)}</div>
          </div>
          <div>
            <div className="caption">Report source</div>
            <div className="body" style={{ fontWeight: 500, textTransform: 'capitalize' }}>{row.report_source || '—'}</div>
          </div>
        </div>
        {booking && (
          <div style={{ marginTop: 'var(--sp-16)', paddingTop: 'var(--sp-16)', borderTop: '1px solid var(--grey-200)' }}>
            <span className="a-badge new" style={{ marginRight: 'var(--sp-8)' }}>Booked</span>
            <Link to="/admin/bookings" className="caption mono">
              {new Date(booking.date).toLocaleDateString()} at {booking.time} · {booking.status}
            </Link>
          </div>
        )}
      </div>

      <ReportView data={submissionRowToReportData(row)} readOnly />

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Raw Responses</p>
        <p className="caption" style={{ marginBottom: 'var(--sp-8)' }}>Every item the participant answered, on a 1 (not at all) to 5 (very much) scale.</p>
        {grouped.map(([label, group]) => (
          <div key={label} style={{ marginTop: 'var(--sp-16)' }}>
            <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>{label} — {group.title}</p>
            {group.items.map((item) => (
              <div key={item.id} className="a-resp-row">
                <span className="caption" style={{ color: 'var(--ink)', flex: 1, paddingRight: 'var(--sp-16)' }}>{item.prompt}</span>
                <div className="a-dot" style={{ opacity: item.value ? 1 : 0.4 }}>
                  {item.value ?? '–'}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
