import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from './supabaseClient'
import BrandMark from './components/BrandMark'
import SelfRateScreen from './components/skill/SelfRateScreen'
import SkillQuestionScreen from './components/skill/SkillQuestionScreen'
import SkillResultView from './components/skill/SkillResultView'
import { loadBank, getSkillMeta } from './lib/skillBanks'
import {
  saveSkillProgress, loadSkillProgress, clearSkillProgress,
  saveSkillToken, loadSkillToken, newSeed, shuffledOptions,
} from './lib/skillProgress'
import { describeError } from './lib/describeError'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function submitSkill(payload) {
  if (!supabase) throw new Error('Missing Supabase configuration in .env.')
  const { data, error } = await supabase.functions.invoke('submit-skill-assessment', { body: payload })
  if (error) {
    // A non-2xx reply arrives as FunctionsHttpError with the Response on .context.
    let body = null
    try { body = await error.context?.json?.() } catch { /* not JSON */ }
    const err = new Error(body?.code || error.message || 'submission_failed')
    err.code = body?.code || error.name
    err.details = body
    throw err
  }
  if (!data?.ok) {
    const err = new Error(data?.code || 'submission_failed')
    err.code = data?.code
    err.details = data
    throw err
  }
  return data
}

function friendlyError(err) {
  if (err?.code === 'bank_version_mismatch') return 'This test was updated while you were taking it. Reload the page to start the new version.'
  if (err?.code === 'rate_limited') return 'You have taken this test several times recently. Please try again later.'
  return describeError(err)
}

function Intro({ meta, bank, resumeOffer, onStart, onResume, onDiscard, lastToken }) {
  const total = bank.items.length
  return (
    <div className="fu">
      <Link to="/skills" aria-label="Back to all skills" className="brand-link" style={{ display: 'inline-flex', marginBottom: 'var(--sp-32)' }}>
        <BrandMark size={16} />
      </Link>
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Skill Assessment</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>{meta.title}</h1>
      <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-24)', maxWidth: 520 }}>{meta.summary}</p>
      <div className="meta-row" style={{ marginBottom: 'var(--sp-24)' }}>
        <span className="meta-chip">{total} questions</span>
        <span className="meta-chip">About {bank.minutes} min</span>
        <span className="meta-chip">Free</span>
      </div>
      <p className="caption" style={{ marginBottom: 'var(--sp-32)', maxWidth: 520 }}>
        You choose the best answer in each short scenario. You get a level, a breakdown by subskill, the patterns to
        work on, and courses matched to your gaps. Levels are provisional and this is not a certificate.
      </p>

      {lastToken && (
        <p className="caption" style={{ marginBottom: 'var(--sp-24)' }}>
          You have taken this before. <Link to={`/s/${lastToken}`} className="link-signal">View your last result<span className="arw" aria-hidden="true">→</span></Link>
        </p>
      )}

      {resumeOffer && (
        <div className="panel" style={{ marginBottom: 'var(--sp-32)' }}>
          <p className="body" style={{ marginBottom: 'var(--sp-16)' }}>You were {resumeOffer.index + 1} of {total} in.</p>
          <div style={{ display: 'flex', gap: 'var(--sp-16)' }}>
            <button type="button" className="btn-cta" style={{ flex: 1 }} onClick={onResume}>Resume →</button>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onDiscard}>Start over</button>
          </div>
        </div>
      )}
      {!resumeOffer && <button type="button" className="btn-cta" onClick={onStart}>Start →</button>}
    </div>
  )
}

function Identity({ identity, onChange, onSubmit, canSubmit, onBack }) {
  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Almost there</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>Your report is ready.</h1>
      <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)', maxWidth: 520 }}>
        Add your name and email to see it. You will also get a private link so you can come back to it.
      </p>
      <div className="panel">
        <div style={{ display: 'grid', gap: 'var(--sp-16)' }}>
          <div className="field">
            <label htmlFor="sk-name">Full name</label>
            <input id="sk-name" className="field-input" type="text" value={identity.fullName}
              onChange={(e) => onChange('fullName', e.target.value)} placeholder="Your full name" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="sk-email">Email</label>
            <input id="sk-email" className="field-input" type="email" value={identity.email}
              onChange={(e) => onChange('email', e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" />
          </div>
          <label className="field-check">
            <input type="checkbox" checked={identity.consent} onChange={(e) => onChange('consent', e.target.checked)} />
            <span>I agree to my answers being stored so that my report can be produced and shown to me again.</span>
          </label>
        </div>
      </div>
      <button type="button" className="btn-cta" onClick={onSubmit} disabled={!canSubmit}>See my report →</button>
      <div style={{ marginTop: 'var(--sp-16)' }}>
        <button type="button" onClick={onBack} className="caption mono link-btn" style={{ color: 'var(--muted)' }}>← Back to the questions</button>
      </div>
    </div>
  )
}

function NotFoundPanel() {
  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>404</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-32)' }}>That skill does not exist.</h1>
      <Link to="/skills" className="link-signal">See all skills<span className="arw" aria-hidden="true">→</span></Link>
    </div>
  )
}

function SkillAssessmentApp({ slug }) {
  const meta = getSkillMeta(slug)
  const [bank, setBank] = useState(meta ? undefined : null) // undefined = loading, null = unknown
  const [phase, setPhase] = useState('intro')
  const [index, setIndex] = useState(0)
  const [selfRatings, setSelfRatings] = useState({})
  const [responses, setResponses] = useState({})
  const [timings, setTimings] = useState({})
  const [seed, setSeed] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [identity, setIdentity] = useState({ fullName: '', email: '', consent: false })
  const [resumeOffer, setResumeOffer] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const topRef = useRef(null)
  const shownAtRef = useRef(0) // set when each screen appears, by the effect below
  const continueRef = useRef(false)

  // Load the public bank (items only; answer keys are server-side).
  useEffect(() => {
    if (!meta) return undefined
    let active = true
    ;(async () => {
      await Promise.resolve()
      try {
        const b = await loadBank(slug)
        if (!active) return
        setBank(b)
        if (b) {
          const saved = loadSkillProgress(slug, b.version)
          if (saved && saved.index >= 0 && saved.index < b.items.length) setResumeOffer(saved)
        }
      } catch (err) {
        if (active) { setError(describeError(err)); setBank(null) }
      }
    })()
    return () => { active = false }
  }, [slug, meta])

  // Persist after every change once the run is underway. Not during intro, so
  // opening the page never overwrites a saved run that has not been resumed yet.
  useEffect(() => {
    if (!bank || (phase !== 'question' && phase !== 'identity')) return
    saveSkillProgress(slug, { bankVersion: bank.version, seed, startedAt, selfRatings, responses, timings, index })
  }, [bank, slug, phase, seed, startedAt, selfRatings, responses, timings, index])

  // New screen: scroll to top, reset the double-click guard, start the item timer.
  useEffect(() => {
    window.scrollTo(0, 0)
    continueRef.current = false
    shownAtRef.current = Date.now()
  }, [phase, index])

  const total = bank?.items.length ?? 0
  const item = bank && phase === 'question' ? bank.items[index] : null
  const options = useMemo(() => (item ? shuffledOptions(item, seed) : []), [item, seed])

  function handleStart() {
    clearSkillProgress(slug)
    setResumeOffer(null)
    setSelfRatings({}); setResponses({}); setTimings({}); setIndex(0)
    setSeed(newSeed())
    setStartedAt(new Date().toISOString())
    setPhase('selfRate')
  }

  function handleResume() {
    const s = resumeOffer
    setSelfRatings(s.selfRatings); setResponses(s.responses); setTimings(s.timings || {})
    setIndex(s.index); setSeed(s.seed); setStartedAt(s.startedAt || null)
    setResumeOffer(null)
    setPhase('question')
  }

  function handleDiscard() {
    clearSkillProgress(slug)
    setResumeOffer(null)
  }

  const handleSelect = useCallback((optionId) => {
    if (!item) return
    setResponses((prev) => ({ ...prev, [item.id]: optionId }))
  }, [item])

  const handleContinue = useCallback(() => {
    if (!item || continueRef.current || !responses[item.id]) return
    // Guard a double-click or key repeat: a second firing would advance twice
    // and silently skip a question. Reset by the screen-change effect above.
    continueRef.current = true
    const elapsed = Date.now() - shownAtRef.current
    setTimings((prev) => ({ ...prev, [item.id]: (prev[item.id] || 0) + elapsed }))
    if (index === total - 1) setPhase('identity')
    else setIndex((i) => i + 1)
  }, [item, responses, index, total])

  const handleBack = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1)
  }, [index])

  const canSubmit = identity.fullName.trim().length > 1 && EMAIL_RE.test(identity.email.trim()) && identity.consent

  async function handleSubmit() {
    setPhase('submitting')
    setError('')
    try {
      const data = await submitSkill({
        skill: slug,
        bankVersion: bank.version,
        responses,
        selfRatings,
        timings,
        startedAt,
        fullName: identity.fullName.trim(),
        email: identity.email.trim().toLowerCase(),
        consent: identity.consent,
      })
      clearSkillProgress(slug)
      saveSkillToken(slug, data.reportToken)
      setOutcome({ ...data, firstName: identity.fullName.trim().split(/\s+/)[0] })
      setPhase('result')
    } catch (err) {
      if (err?.code === 'bank_version_mismatch') clearSkillProgress(slug)
      setError(friendlyError(err))
      setPhase('error')
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}/s/${outcome.reportToken}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (bank === undefined) {
    return (
      <div className="wrap surface-paper app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="wrap surface-paper app" ref={topRef}>
      {bank === null && <NotFoundPanel />}

      {bank && phase === 'intro' && (
        <Intro
          meta={meta} bank={bank} resumeOffer={resumeOffer} lastToken={loadSkillToken(slug)}
          onStart={handleStart} onResume={handleResume} onDiscard={handleDiscard}
        />
      )}

      {bank && phase === 'selfRate' && (
        <SelfRateScreen
          title={bank.title}
          subskills={bank.subskills}
          ratings={selfRatings}
          onRate={(id, n) => setSelfRatings((prev) => ({ ...prev, [id]: n }))}
          onContinue={() => setPhase('question')}
          onBack={() => setPhase('intro')}
        />
      )}

      {bank && item && (
        <SkillQuestionScreen
          key={item.id}
          item={item}
          options={options}
          index={index}
          total={total}
          subskillLabel={bank.subskills.find((s) => s.id === item.subskill).label}
          subskillNumber={bank.subskills.findIndex((s) => s.id === item.subskill) + 1}
          subskillCount={bank.subskills.length}
          value={responses[item.id]}
          onSelect={handleSelect}
          onContinue={handleContinue}
          onBack={handleBack}
          canGoBack={index > 0}
          isLast={index === total - 1}
          minutesLeft={Math.max(1, Math.round(((total - index) * bank.minutes) / total))}
        />
      )}

      {bank && phase === 'identity' && (
        <Identity
          identity={identity}
          onChange={(field, value) => setIdentity((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          onBack={() => { setPhase('question') }}
        />
      )}

      {phase === 'submitting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', gap: 'var(--sp-24)' }}>
          <div className="spinner" />
          <p className="body">Evaluating your answers…</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="fu">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Something went wrong</p>
          <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>We could not score your test.</h1>
          <div className="panel" role="alert"><p className="caption">{error}</p></div>
          <p className="caption" style={{ marginBottom: 'var(--sp-24)' }}>Your answers are saved on this device. Nothing has been lost.</p>
          <div style={{ display: 'grid', gap: 'var(--sp-8)' }}>
            <button type="button" className="btn-cta" onClick={handleSubmit}>Try again →</button>
            <button type="button" className="btn-secondary" onClick={() => setPhase('identity')}>Edit my details</button>
          </div>
        </div>
      )}

      {bank && phase === 'result' && outcome && (
        <>
          <SkillResultView
            result={outcome.result}
            skillTitle={bank.title}
            firstName={outcome.firstName}
            attemptNo={outcome.attemptNo}
          />
          <div className="panel no-print" style={{ marginTop: 'var(--sp-32)' }}>
            <p className="body" style={{ fontWeight: 500, marginBottom: 'var(--sp-8)' }}>Keep this link to return to your report</p>
            <p className="caption mono" style={{ wordBreak: 'break-all', marginBottom: 'var(--sp-16)' }}>
              {window.location.origin}/s/{outcome.reportToken}
            </p>
            <button type="button" className="btn-secondary" onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</button>
          </div>
        </>
      )}
    </div>
  )
}

export default function SkillAssessmentRoute() {
  const { slug } = useParams()
  // key resets all state if the visitor moves from one skill to another.
  return <SkillAssessmentApp key={slug} slug={slug} />
}
