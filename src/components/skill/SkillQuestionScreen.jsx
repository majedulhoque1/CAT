import { useEffect, useRef } from 'react'
import StimulusChart from './StimulusChart'

const LETTERS = ['A', 'B', 'C', 'D']

// One knowledge question. Unlike the Likert flow there is no auto-advance:
// an accidental tap on a knowledge item costs a wrong answer, so the learner
// selects, then confirms with Continue (or Enter).
export default function SkillQuestionScreen({
  item, options, index, total, subskillLabel, subskillNumber, subskillCount,
  value, onSelect, onContinue, onBack, canGoBack, isLast, minutesLeft,
}) {
  const promptRef = useRef(null)

  // Move focus to the prompt on each new question so keyboard and screen-reader
  // users land on the content, not at the end of the previous page.
  useEffect(() => {
    promptRef.current?.focus({ preventScroll: true })
  }, [item.id])

  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const k = e.key.toLowerCase()
      const letterIdx = ['a', 'b', 'c', 'd'].indexOf(k)
      const numIdx = ['1', '2', '3', '4'].indexOf(k)
      const idx = letterIdx >= 0 ? letterIdx : numIdx
      if (idx >= 0 && options[idx]) {
        onSelect(options[idx].id)
      } else if (e.key === 'Enter' && value && !(t && t.tagName === 'BUTTON')) {
        e.preventDefault()
        onContinue()
      } else if (e.key === 'ArrowLeft' && canGoBack) {
        onBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, value, onSelect, onContinue, onBack, canGoBack])

  const percent = (index / total) * 100
  const num = String(subskillNumber).padStart(2, '0')

  return (
    <div className="fu">
      <div className="section-mark">
        <span className="num">{num}</span>
        <span className="of">/ {String(subskillCount).padStart(2, '0')} &middot; {subskillLabel}</span>
      </div>

      <div className="dim-line">
        <div className="dim-value">
          <span className="num">{index + 1} of {total}</span>
          <span className="num">~{minutesLeft} min left</span>
        </div>
        <div className="dim-track">
          <div className="dim-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <h2
        id={`q-${item.id}`}
        ref={promptRef}
        tabIndex={-1}
        className="body skill-prompt"
      >
        {item.prompt}
      </h2>

      <StimulusChart stimulus={item.stimulus} />

      <div className="choice-list" role="radiogroup" aria-labelledby={`q-${item.id}`}>
        {options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value === opt.id}
            className={`choice${value === opt.id ? ' sel' : ''}`}
            onClick={() => onSelect(opt.id)}
          >
            <span className="key" aria-hidden="true">{LETTERS[i]}</span>
            <span>{opt.text}</span>
          </button>
        ))}
      </div>

      <div className="skill-actions">
        <button type="button" className="btn-cta" onClick={onContinue} disabled={!value}>
          {isLast ? 'Finish →' : 'Continue →'}
        </button>
        <div style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}>
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="caption mono link-btn"
              style={{ color: 'var(--muted)' }}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
      <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>
        Keys: A–D to choose, Enter to continue.
      </p>
    </div>
  )
}
