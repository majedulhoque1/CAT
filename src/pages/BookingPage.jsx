import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { buildIcs, downloadIcs } from '../lib/ics'
import { COACH_WHATSAPP } from '../content/contact'
import { loadReportToken } from '../lib/progress'
import MarketingLayout from '../components/MarketingLayout'
import SlotCalendar from '../components/SlotCalendar'
import LiquidButton from '../components/LiquidButton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DAY_MS = 24 * 60 * 60 * 1000

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
function addDaysIso(base, days) {
  return new Date(new Date(base).getTime() + days * DAY_MS).toISOString().slice(0, 10)
}
function formatDateLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function formatTimeLabel(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * Shown to anyone without a report token. Deliberately renders the REAL
 * calendar rather than a text wall: seeing four genuine slots left this week
 * is the argument for spending eight minutes. Every slot is disabled, and the
 * reason sits above the grid — a wall of dead buttons with no explanation
 * reads as a broken page, which is the failure mode this state has to avoid.
 */
function LockedCalendar({ grouped, summary }) {
  const [email, setEmail] = useState('')
  const [recoveryState, setRecoveryState] = useState('idle') // idle | sending | sent
  const [showRecovery, setShowRecovery] = useState(false)

  async function handleRecover() {
    if (!EMAIL_RE.test(email.trim()) || !supabase) return
    setRecoveryState('sending')
    // The function answers identically whether or not the address is known, so
    // there is nothing to branch on here — and nothing this client could leak.
    await supabase.functions.invoke('send-report-link', {
      body: { email: email.trim().toLowerCase() },
    })
    setRecoveryState('sent')
  }

  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Free 30-minute discovery session</p>
      <h1 className="hero-fluid" style={{ marginBottom: 'var(--sp-24)', maxWidth: '16ch' }}>
        Take the assessment to open the calendar.
      </h1>

      <div className="gate-note">
        <p className="body" style={{ color: 'var(--muted)' }}>
          Samir reads your profile before the session, so the 30 minutes goes on your situation
          rather than on questions a form could have asked. It takes about eight minutes.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-24)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--sp-48)' }}>
        <LiquidButton to="/cat/take?intent=call">Start the assessment →</LiquidButton>
        {!showRecovery && (
          <button
            type="button"
            className="link-signal link-btn"
            onClick={() => setShowRecovery(true)}
          >
            Already assessed? Email me my link
            <span className="arw" aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {showRecovery && (
        <div className="panel" style={{ maxWidth: 520, marginBottom: 'var(--sp-48)' }}>
          {recoveryState === 'sent' ? (
            <p className="body">
              If we have a report for that address, the link is on its way.
            </p>
          ) : (
            <>
              <div className="field" style={{ marginBottom: 'var(--sp-16)' }}>
                <label htmlFor="recover-email">Email you used</label>
                <input
                  id="recover-email"
                  className="field-input"
                  type="email"
                  value={email}
                  autoComplete="email"
                  inputMode="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                className="btn-secondary"
                onClick={handleRecover}
                disabled={!EMAIL_RE.test(email.trim()) || recoveryState === 'sending'}
              >
                {recoveryState === 'sending' ? 'Sending…' : 'Send my report link'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="section-mark">
        <span className="of">The calendar you&rsquo;ll unlock</span>
      </div>

      {summary && (
        <p className="caption mono" style={{ marginBottom: 'var(--sp-24)' }}>
          {summary.remaining} of {summary.capacity} sessions left this week &middot; GMT+6 (Dhaka)
        </p>
      )}

      {!grouped ? (
        <div className="spinner" style={{ margin: 'var(--sp-32) 0' }} />
      ) : (
        <SlotCalendar days={grouped} locked />
      )}
    </div>
  )
}

export default function BookingPage() {
  const [params] = useSearchParams()
  const urlToken = params.get('r')

  // A token in the URL always wins; otherwise fall back to the one this browser
  // saved on a previous completed run, so a returning visitor on the same
  // device never sees the gate twice. Derived rather than mirrored into state,
  // so arriving at /book and then navigating to /book?r=… still resolves.
  const [storedToken, setStoredToken] = useState(null)
  const [storageChecked, setStorageChecked] = useState(false)
  const token = urlToken || storedToken
  const tokenResolved = !!urlToken || storageChecked

  const [preview, setPreview] = useState(null)
  const [slots, setSlots] = useState(null)
  const [summary, setSummary] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', note: '' })
  const [status, setStatus] = useState('form') // form | submitting | success | error
  const [errorCode, setErrorCode] = useState('')
  const [successInfo, setSuccessInfo] = useState(null)

  useEffect(() => {
    // async IIFE so setState lands after an await rather than synchronously in
    // the effect body — same convention as AdminDashboard/AssessmentApp.
    ;(async () => {
      await Promise.resolve()
      setStoredToken(loadReportToken())
      setStorageChecked(true)
    })()
  }, [])

  // Slots and the capacity line are anon-readable (0005/0013), so the locked
  // view can show real availability without a token.
  useEffect(() => {
    if (!supabase) return
    supabase.rpc('get_slot_summary').then(({ data }) => { if (data) setSummary(data) })
    supabase.rpc('get_available_slots', { p_from: todayIso(), p_to: addDaysIso(todayIso(), 13) }).then(({ data, error }) => {
      if (!error && data) setSlots(data)
      else setSlots([])
    })
  }, [])

  useEffect(() => {
    if (!supabase || !token) return
    supabase.rpc('get_report_by_token', { p_token: token }).then(({ data }) => {
      if (data) {
        setPreview(data)
        setForm((f) => ({ ...f, name: data.full_name || f.name }))
      }
    })
  }, [token])

  const grouped = useMemo(() => {
    if (!slots) return null
    const map = new Map()
    for (const s of slots) {
      const list = map.get(s.slot_date) || []
      list.push(s.slot_time)
      map.set(s.slot_date, list)
    }
    return [...map.entries()]
  }, [slots])

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const canSubmit = selected && form.name.trim().length > 1 && EMAIL_RE.test(form.email.trim())

  async function handleSubmit() {
    if (!supabase) return
    setStatus('submitting')
    setErrorCode('')
    const { data, error } = await supabase.rpc('request_booking', {
      p_name: form.name.trim(),
      p_email: form.email.trim().toLowerCase(),
      p_phone: form.phone.trim() || null,
      p_report_token: token || null,
      p_slot_date: selected.date,
      p_slot_time: selected.time,
      p_note: form.note.trim() || null,
    })

    if (error || !data || data.status !== 'ok') {
      setErrorCode(data?.status || error?.message || 'error')
      setStatus('error')
      return
    }

    setSuccessInfo({ date: selected.date, time: selected.time, hollandCode: preview?.holland_code })
    setStatus('success')
  }

  function handleDownloadIcs() {
    const ics = buildIcs({
      date: successInfo.date,
      time: successInfo.time,
      durationMinutes: 30,
      title: 'thriveABL — Discovery Session',
      description: 'Free 30-minute discovery session with thriveABL.',
    })
    downloadIcs(ics)
  }

  const whatsappText = successInfo
    ? `Hi! I just booked a thriveABL discovery session for ${formatDateLabel(successInfo.date)} at ${formatTimeLabel(successInfo.time)} (GMT+6).${successInfo.hollandCode ? ` My Holland code is ${successInfo.hollandCode}.` : ''}`
    : ''

  let content

  if (!tokenResolved) {
    content = <div className="spinner" style={{ margin: 'var(--sp-64) auto' }} />
  } else if (!token) {
    content = <LockedCalendar grouped={grouped} summary={summary} />
  } else if (status === 'success') {
    content = (
      <div className="fu">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Booked</p>
        <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>
          {formatDateLabel(successInfo.date)} at {formatTimeLabel(successInfo.time)} (GMT+6 Dhaka)
        </h1>
        <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)' }}>
          Your free 30-minute discovery session is confirmed.
        </p>
        <div style={{ display: 'grid', gap: 'var(--sp-16)', maxWidth: 420 }}>
          <button className="btn-secondary" onClick={handleDownloadIcs}>Add to calendar (.ics)</button>
          {COACH_WHATSAPP && (
            <a
              href={`https://wa.me/${COACH_WHATSAPP.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappText)}`}
              target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div className="btn-cta">Confirm on WhatsApp →</div>
            </a>
          )}
        </div>
      </div>
    )
  } else {
    content = (
      <div className="fu">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Free 30-minute discovery session</p>
        <h1 className="hero-title" style={{ marginBottom: 'var(--sp-8)' }}>Pick a time.</h1>
        {summary && (
          <p className="caption mono" style={{ marginBottom: 'var(--sp-32)' }}>
            {summary.remaining} of {summary.capacity} sessions left this week &middot; GMT+6 (Dhaka)
          </p>
        )}

        {!grouped ? (
          <div className="spinner" style={{ margin: 'var(--sp-32) 0' }} />
        ) : (
          <SlotCalendar days={grouped} selected={selected} onSelect={setSelected} />
        )}

        {selected && (
          <div className="panel" style={{ marginTop: 'var(--sp-32)', maxWidth: 560 }}>
            <div style={{ display: 'grid', gap: 'var(--sp-16)' }}>
              <div className="field">
                <label>Full name</label>
                <input className="field-input" value={form.name} onChange={(e) => handleFormChange('name', e.target.value)} />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="field-input" type="email" value={form.email} onChange={(e) => handleFormChange('email', e.target.value)} />
              </div>
              <div className="field">
                <label>Phone (optional)</label>
                <input className="field-input" value={form.phone} onChange={(e) => handleFormChange('phone', e.target.value)} />
              </div>
              <div className="field">
                <label>What do you most want out of this call? (optional)</label>
                <input className="field-input" value={form.note} onChange={(e) => handleFormChange('note', e.target.value)} />
              </div>
            </div>

            {status === 'error' && (
              <p className="caption" style={{ marginTop: 'var(--sp-16)' }}>
                {{
                  invalid_token: 'Priority booking requires a completed assessment.',
                  slot_taken: 'That slot was just taken — pick another.',
                  already_booked: 'You already have an upcoming call booked.',
                  rate_limited: 'Too many booking attempts — try again later.',
                  invalid_slot: 'That slot is no longer available.',
                  invalid_input: 'Please check your name and email.',
                }[errorCode] || 'Something went wrong — please try again.'}
              </p>
            )}

            <button className="btn-cta" style={{ marginTop: 'var(--sp-24)' }} onClick={handleSubmit} disabled={!canSubmit || status === 'submitting'}>
              {status === 'submitting' ? 'Booking…' : 'Confirm booking →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <MarketingLayout surface="paper">
      <div className="mkt">
        <section className="sec">{content}</section>
      </div>
    </MarketingLayout>
  )
}
