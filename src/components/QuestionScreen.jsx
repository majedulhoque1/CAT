import { useEffect } from 'react'

const AUTO_ADVANCE_MS = 250

export default function QuestionScreen({ item, index, total, value, onSelect, onBack, canGoBack }) {
  const minutesLeft = Math.max(1, Math.round(((total - index) * 8) / total))
  const percent = (index / total) * 100

  useEffect(() => {
    function handleKey(e) {
      if (e.key >= '1' && e.key <= '5') onSelect(Number(e.key))
      else if (e.key === 'ArrowLeft' && canGoBack) onBack()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onSelect, onBack, canGoBack])

  return (
    <div className="fu">
      <div className="section-mark">
        <span className="num">{item.sectionLabel}</span>
        <span className="of">/ 04 &middot; {item.sectionTitle}</span>
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

      <p className="body" style={{ fontSize: 'var(--fs-24)', lineHeight: 'var(--lh-32)', margin: 'var(--sp-48) 0 var(--sp-32)' }}>
        {item.prompt}
      </p>

      <div className="likert-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={`likert-cell${value === n ? ' sel' : ''}`}
            onClick={() => onSelect(n)}
            aria-label={`${n} of 5`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="likert-anchors">
        <span>Not at all</span>
        <span>Very much</span>
      </div>

      <div style={{ marginTop: 'var(--sp-48)', minHeight: 44 }}>
        {canGoBack && (
          <button
            onClick={onBack}
            className="caption mono"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}

export { AUTO_ADVANCE_MS }
