import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import AdminNav from './AdminNav'

function formatDate(d) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function waLink(phone, text) {
  return `https://wa.me/${String(phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState(null)
  const [reminders, setReminders] = useState(null)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    const today = new Date().toISOString().slice(0, 10)

    const { data: bookingRows, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, date, time, status, details, contacts(name, email, phone)')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (bookingsError) setError(bookingsError.message)
    setBookings(bookingRows || [])

    const { data: reminderRows } = await supabase
      .from('notification_outbox')
      .select('id, payload, bookings(date, time, contacts(name, phone, email))')
      .eq('event', 'reminder')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
    setReminders(reminderRows || [])
  }

  useEffect(() => {
    // async IIFE + leading await so load()'s setState calls run after the
    // effect body's synchronous execution (react-hooks/set-state-in-effect).
    ;(async () => {
      await Promise.resolve()
      load()
    })()
  }, [])

  async function updateStatus(id, status) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    load()
  }

  async function markReminderSent(id) {
    await supabase.from('notification_outbox').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div className="wrap-wide fu">
      <AdminNav />
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-8)' }}>Admin Portal</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-24)' }}>Bookings</h1>

      {error && (
        <div className="panel"><p className="caption">Could not load bookings: {error}</p></div>
      )}

      {reminders && reminders.length > 0 && (
        <div className="panel">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Reminders due — tomorrow's confirmed calls</p>
          {reminders.map((r) => {
            const b = r.bookings
            const contact = b?.contacts
            const text = `Hi ${contact?.name || ''}, quick reminder — your thriveABL Discovery Call is tomorrow at ${b?.time} (GMT+6 Dhaka). Looking forward to it!`
            return (
              <div key={r.id} className="a-resp-row">
                <span className="caption" style={{ flex: 1 }}>
                  {contact?.name || 'Unknown'} · {b ? formatDate(b.date) : ''} {b?.time}
                </span>
                <div style={{ display: 'flex', gap: 'var(--sp-8)' }}>
                  {contact?.phone && (
                    <a className="a-btn" href={waLink(contact.phone, text)} target="_blank" rel="noreferrer">WhatsApp</a>
                  )}
                  <button className="a-btn" onClick={() => markReminderSent(r.id)}>Mark sent</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {!bookings ? (
          <div style={{ padding: 'var(--sp-32)', display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: 'var(--sp-32)', textAlign: 'center' }}><p className="caption">No upcoming bookings.</p></div>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="a-list-row" style={{ cursor: 'default' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-8)' }}>
                  <span className="body" style={{ fontWeight: 500 }}>{b.contacts?.name || 'Unnamed'}</span>
                  {b.details?.holland_code && <span className="a-badge holland">{b.details.holland_code}</span>}
                  <span className="a-badge">{b.status}</span>
                </div>
                <div className="caption">
                  {b.contacts?.email || '—'} · {formatDate(b.date)} {b.time} (GMT+6)
                  {b.details?.report_url && (
                    <>
                      {' · '}
                      <a href={b.details.report_url} target="_blank" rel="noreferrer">Report</a>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-8)', flexShrink: 0 }}>
                {b.status !== 'confirmed' && <button className="a-btn" onClick={() => updateStatus(b.id, 'confirmed')}>Confirm</button>}
                {b.status !== 'cancelled' && <button className="a-btn danger" onClick={() => updateStatus(b.id, 'cancelled')}>Cancel</button>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
