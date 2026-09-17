import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from './AdminNav'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function emptyDraft() {
  return { weekday: 0, start_time: '10:00', end_time: '18:00', slot_minutes: 30, active: true }
}

export default function AdminAvailability() {
  const [rows, setRows] = useState(null)
  const [draft, setDraft] = useState(emptyDraft())
  const [error, setError] = useState('')

  async function load() {
    const { data, error: loadError } = await supabase
      .from('availability')
      .select('*')
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true })
    if (loadError) setError(loadError.message)
    setRows(data || [])
  }

  useEffect(() => {
    // async IIFE + leading await so load()'s setState calls run after the
    // effect body's synchronous execution (react-hooks/set-state-in-effect).
    ;(async () => {
      await Promise.resolve()
      load()
    })()
  }, [])

  async function handleAdd() {
    setError('')
    const { error: insertError } = await supabase.from('availability').insert({
      weekday: Number(draft.weekday),
      start_time: draft.start_time,
      end_time: draft.end_time,
      slot_minutes: Number(draft.slot_minutes),
      active: true,
    })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setDraft(emptyDraft())
    load()
  }

  async function toggleActive(row) {
    await supabase.from('availability').update({ active: !row.active }).eq('id', row.id)
    load()
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this availability window?')) return
    await supabase.from('availability').delete().eq('id', id)
    load()
  }

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Admin Portal</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-8)' }}>Availability</h1>
      <p className="caption" style={{ marginBottom: 'var(--sp-24)' }}>
        Discovery Call windows, all times Asia/Dhaka. The weekly capacity shown to candidates is derived from these.
      </p>

      {error && <div className="panel"><p className="caption">{error}</p></div>}

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {!rows ? (
          <div style={{ padding: 'var(--sp-32)', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 'var(--sp-32)', textAlign: 'center' }}><p className="caption">No availability windows yet.</p></div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="a-resp-row">
              <span className="caption mono" style={{ flex: 1 }}>
                {WEEKDAYS[row.weekday]} &middot; {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)} &middot; {row.slot_minutes}min slots
              </span>
              <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
                <button className="a-btn" onClick={() => toggleActive(row)}>{row.active ? 'Deactivate' : 'Activate'}</button>
                <button className="a-btn danger" onClick={() => handleDelete(row.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Add window</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 'var(--sp-16)', marginBottom: 'var(--sp-16)' }}>
          <div className="field">
            <label>Weekday</label>
            <select className="field-input" value={draft.weekday} onChange={(e) => setDraft((d) => ({ ...d, weekday: e.target.value }))}>
              {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Start</label>
            <input className="field-input" type="time" value={draft.start_time} onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))} />
          </div>
          <div className="field">
            <label>End</label>
            <input className="field-input" type="time" value={draft.end_time} onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))} />
          </div>
          <div className="field">
            <label>Slot length (min)</label>
            <input className="field-input" type="number" min="5" step="5" value={draft.slot_minutes} onChange={(e) => setDraft((d) => ({ ...d, slot_minutes: e.target.value }))} />
          </div>
        </div>
        <button className="a-btn primary" onClick={handleAdd}>Add window</button>
      </div>
    </div>
  )
}
