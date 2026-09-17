import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import BrandMark from './components/BrandMark'
import ReportView from './components/ReportView'
import QuestionScreen, { AUTO_ADVANCE_MS } from './components/QuestionScreen'
import SectionBreak from './components/SectionBreak'
import { RESPONSE_ITEM_META, microInsightForSection, apiResultToReportData, buildFallbackReport, computeScores } from './lib/assessment'
import {
  saveProgress, loadProgress, clearProgress,
  saveReportToken, saveEntryIntent, loadEntryIntent, clearEntryIntent,
} from './lib/progress'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOTAL = RESPONSE_ITEM_META.length

function isSectionEnd(index) {
  return index === TOTAL - 1 || RESPONSE_ITEM_META[index].sectionId !== RESPONSE_ITEM_META[index + 1].sectionId
}

async function submitAssessment(responses, identity, entryIntent) {
  if (!supabase) throw new Error('Missing Supabase configuration in .env.')

  const { data, error } = await supabase.functions.invoke('submit-assessment', {
    body: {
      version: 1,
      responses,
      fullName: identity.fullName.trim(),
      email: identity.email.trim().toLowerCase(),
      consent: identity.consent,
      intent: entryIntent,
      meta: { submittedAt: new Date().toISOString() },
    },
  })

  if (error) throw error
  if (!data?.ok) {
    const err = new Error(data?.code || 'submission_failed')
    err.code = data?.code
    err.details = data
    throw err
  }
  return data
}

function Intro({ onStart, resumeOffer, onResume, onDiscard, forCall }) {
  return (
    <div className="fu">
      {/* The question/section-break/identity screens deliberately have no way
          out — that's the funnel doing its job. But nobody has committed to
          anything yet at this screen, so trapping them here too just reads as
          a dead end instead of a decision. */}
      <Link
        to="/"
        aria-label={`Back to thriveABL`}
        className="brand-link"
        style={{ display: 'inline-flex', marginBottom: 'var(--sp-32)' }}
      >
        <BrandMark size={16} />
      </Link>
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Career Identity Assessment</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>34 items. About 8 minutes.</h1>
      <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)', maxWidth: 460 }}>
        Personality, career interests, work values and motivation — one question at a time. Your report assembles as you go.
      </p>

      {/* Arrived from the locked booking calendar — say so, so the detour from
          "book a session" to "answer 34 questions" never feels like a switch. */}
      {forCall && (
        <div className="gate-note">
          <p className="caption">
            Finishing this unlocks the discovery-session calendar. Samir reads your profile
            beforehand, so the 30 minutes goes on your situation.
          </p>
        </div>
      )}

      {resumeOffer && (
        <div className="panel" style={{ marginBottom: 'var(--sp-32)' }}>
          <p className="body" style={{ marginBottom: 'var(--sp-16)' }}>
            You were {resumeOffer.questionIndex} of {TOTAL} in.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-16)' }}>
            <button className="btn-cta" style={{ flex: 1 }} onClick={onResume}>Resume →</button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={onDiscard}>Start over</button>
          </div>
        </div>
      )}

      {!resumeOffer && (
        <button className="btn-cta" onClick={onStart}>Start Assessment →</button>
      )}
    </div>
  )
}

function Identity({ identity, onChange, onSubmit, canSubmit }) {
  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Almost there</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>Your report is ready — where should we send it?</h1>
      <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)' }}>
        We'll show it to you right now, and send a copy to your email.
      </p>

      <div className="panel">
        <div style={{ display: 'grid', gap: 'var(--sp-16)' }}>
          <div className="field">
            <label>Full name</label>
            <input
              className="field-input"
              type="text"
              value={identity.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              className="field-input"
              type="email"
              value={identity.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>
          <label className="field-check">
            <input type="checkbox" checked={identity.consent} onChange={(e) => onChange('consent', e.target.checked)} />
            <span>I agree to my responses being used to generate my report.</span>
          </label>
        </div>
      </div>

      <button className="btn-cta" onClick={onSubmit} disabled={!canSubmit}>See my report →</button>
    </div>
  )
}

function Loading({ msg }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 'var(--sp-24)' }}>
      <div className="spinner" />
      <p className="body">{msg}</p>
    </div>
  )
}

export default function AssessmentApp() {
  const [phase, setPhase] = useState('intro')
  const [qIndex, setQIndex] = useState(0)
  const [responses, setResponses] = useState({})
  const [breakSectionCount, setBreakSectionCount] = useState(0)
  const [identity, setIdentity] = useState({ fullName: '', email: '', consent: false })
  const [report, setReport] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [loadMsg, setLoadMsg] = useState('Scoring your responses…')
  const [resumeOffer, setResumeOffer] = useState(null)
  const [entryIntent, setEntryIntent] = useState('self_serve')
  const [params] = useSearchParams()
  const intentParam = params.get('intent')
  const topRef = useRef(null)
  const advanceTimerRef = useRef(null)
  const breakAdvancingRef = useRef(false)

  useEffect(() => {
    // async IIFE so setState runs after an await, not synchronously in the
    // effect body (react-hooks/set-state-in-effect) — same convention as
    // AdminDashboard.jsx.
    ;(async () => {
      await Promise.resolve()
      const saved = loadProgress()
      if (saved && saved.questionIndex > 0 && saved.questionIndex < TOTAL) setResumeOffer(saved)

      // Persist intent rather than reading the URL at submit time: the run can
      // span days and a resumed session has no query string left.
      if (intentParam === 'call') saveEntryIntent('discovery_call')
      setEntryIntent(loadEntryIntent())
    })()
  }, [intentParam])

  function scrollToTop() {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }

  useEffect(() => {
    scrollToTop()
    breakAdvancingRef.current = false
  }, [phase, qIndex])

  function handleStart() {
    clearProgress()
    setResumeOffer(null)
    setQIndex(0)
    setResponses({})
    setBreakSectionCount(0)
    setPhase('question')
  }

  function handleResume() {
    setResponses(resumeOffer.responses)
    setQIndex(resumeOffer.questionIndex)
    setBreakSectionCount([...new Set(RESPONSE_ITEM_META.slice(0, resumeOffer.questionIndex).map((i) => i.sectionId))].length)
    setResumeOffer(null)
    setPhase('question')
  }

  function handleDiscard() {
    clearProgress()
    setResumeOffer(null)
  }

  function handleSelect(value) {
    const item = RESPONSE_ITEM_META[qIndex]
    // Functional updater — building the next object from the closure's
    // `responses` (rather than the previous-state callback) can silently
    // drop an answer if two updates land in the same React batch.
    setResponses((prev) => {
      const next = { ...prev, [item.id]: value }
      saveProgress(next, qIndex + 1)
      return next
    })

    // Re-clicking the same question (changing an answer) before the pending
    // advance fires must cancel the earlier timer, not stack a second one —
    // two pending advances for one question both call setQIndex(i+1), which
    // double-advances and silently skips the next question.
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null
      if (isSectionEnd(qIndex)) {
        const doneSections = [...new Set(RESPONSE_ITEM_META.slice(0, qIndex + 1).map((i) => i.sectionId))].length
        setBreakSectionCount(doneSections)
        setPhase('sectionBreak')
      } else {
        setQIndex((i) => i + 1)
      }
    }, AUTO_ADVANCE_MS)
  }

  function handleBack() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    if (qIndex > 0) setQIndex((i) => i - 1)
  }

  function handleContinueFromBreak() {
    // Guard against a double-click firing this twice before the phase change
    // commits — otherwise a second firing increments qIndex an extra time and
    // silently skips a question. Reset by the phase-change effect below.
    if (breakAdvancingRef.current) return
    breakAdvancingRef.current = true
    if (qIndex === TOTAL - 1) {
      setPhase('identity')
    } else {
      setQIndex((i) => i + 1)
      setPhase('question')
    }
  }

  function handleIdentityChange(field, value) {
    setIdentity((prev) => ({ ...prev, [field]: value }))
  }

  const canSubmitIdentity = identity.fullName.trim().length > 1 && EMAIL_RE.test(identity.email.trim()) && identity.consent

  async function handleSubmit() {
    setPhase('loading')
    setSubmitError('')
    setLoadMsg('Scoring your responses…')

    const messages = ['Scoring your responses…', 'Writing your narrative…', 'Almost there — finalising your profile…']
    let step = 0
    const timer = setInterval(() => {
      step += 1
      if (step < messages.length) setLoadMsg(messages[step])
    }, 6000)

    try {
      const data = await submitAssessment(responses, identity, entryIntent)
      clearInterval(timer)
      clearProgress()
      // Remember the token so this browser's booking calendar unlocks on a
      // later visit without another round of 34 questions.
      saveReportToken(data.reportToken)
      clearEntryIntent()
      setReport(apiResultToReportData(data))
      setPhase('report')
    } catch (error) {
      clearInterval(timer)
      // Last-ditch local fallback so a network/persist failure never dead-ends the user.
      const scores = computeScores(responses)
      const fallback = buildFallbackReport(scores)
      setReport({
        parsed: fallback,
        bf: scores.bf,
        ri: scores.ri,
        top3R: scores.hollandCode,
        topVals: scores.topValues,
        topMot: scores.topMotivators,
        source: 'fallback',
        saveResult: { ok: false, error: error?.message || 'Unable to reach the server.' },
      })
      setSubmitError(error?.message || 'Something went wrong, but here is a local copy of your report.')
      setPhase('report')
    }
  }

  const currentItem = RESPONSE_ITEM_META[qIndex]
  const insight = phase === 'sectionBreak' ? microInsightForSection(RESPONSE_ITEM_META[qIndex]?.sectionId, responses) : ''

  return (
    <div className="wrap surface-paper app" ref={topRef}>
      {phase === 'intro' && (
        <Intro
          onStart={handleStart}
          resumeOffer={resumeOffer}
          onResume={handleResume}
          onDiscard={handleDiscard}
          forCall={entryIntent === 'discovery_call'}
        />
      )}

      {phase === 'question' && currentItem && (
        <QuestionScreen
          key={qIndex}
          item={currentItem}
          index={qIndex}
          total={TOTAL}
          value={responses[currentItem.id]}
          onSelect={handleSelect}
          onBack={handleBack}
          canGoBack={qIndex > 0}
        />
      )}

      {phase === 'sectionBreak' && (
        <SectionBreak
          unlockedCount={breakSectionCount}
          insight={insight}
          isFinal={qIndex === TOTAL - 1}
          onContinue={handleContinueFromBreak}
        />
      )}

      {phase === 'identity' && (
        <Identity identity={identity} onChange={handleIdentityChange} onSubmit={handleSubmit} canSubmit={canSubmitIdentity} />
      )}

      {phase === 'loading' && <Loading msg={loadMsg} />}

      {phase === 'report' && report && (
        <>
          {submitError && (
            <div className="panel" style={{ marginBottom: 'var(--sp-16)' }}>
              <p className="caption">{submitError}</p>
            </div>
          )}
          <ReportView data={report} />
        </>
      )}
    </div>
  )
}
