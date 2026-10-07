// Before the test: the learner rates themselves on each subskill. This is NOT
// part of the score. It exists so the report can show self-estimate against
// measured result, the gap between the two being the useful coaching signal.
const ANCHORS = ['Beginner', 'Expert']

export default function SelfRateScreen({ title, subskills, ratings, onRate, onContinue, onBack }) {
  const complete = subskills.every((s) => Number.isInteger(ratings[s.id]))

  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>Before you start &middot; {title}</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-16)' }}>How would you rate yourself?</h1>
      <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)', maxWidth: 520 }}>
        Go with your first instinct. This does not affect your score. After the test, your report compares
        what you expected with what the questions showed.
      </p>

      <div style={{ display: 'grid', gap: 'var(--sp-32)', marginBottom: 'var(--sp-32)' }}>
        {subskills.map((s) => (
          <fieldset key={s.id} className="selfrate-group">
            <legend className="body" style={{ fontWeight: 500, marginBottom: 'var(--sp-8)' }}>
              {s.selfRatePrompt}
            </legend>
            <p className="caption mono" style={{ marginBottom: 'var(--sp-8)' }}>{s.label}</p>
            <div className="likert-row" role="radiogroup" aria-label={s.label}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={ratings[s.id] === n}
                  className={`likert-cell${ratings[s.id] === n ? ' sel' : ''}`}
                  onClick={() => onRate(s.id, n)}
                  aria-label={`${s.label}: ${n} of 5`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="likert-anchors">
              <span>{ANCHORS[0]}</span>
              <span>{ANCHORS[1]}</span>
            </div>
          </fieldset>
        ))}
      </div>

      <button type="button" className="btn-cta" onClick={onContinue} disabled={!complete}>
        Start the questions →
      </button>
      <div style={{ marginTop: 'var(--sp-16)' }}>
        <button type="button" onClick={onBack} className="caption mono link-btn" style={{ color: 'var(--muted)' }}>
          ← Back
        </button>
      </div>
    </div>
  )
}
