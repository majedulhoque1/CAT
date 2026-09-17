import { SECTIONS } from '../lib/assessment'

// The gamified unlock (Beat 1 + 2 of the plan): four report panels, one more
// resolving from locked/blurred to unlocked/sharp at each section boundary,
// paying out one true micro-insight computed from the answers already given.
export default function SectionBreak({ unlockedCount, insight, isFinal, onContinue }) {
  return (
    <div className="fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-32)' }}>Your report is assembling</p>

      {SECTIONS.map((section, i) => {
        const unlocked = i < unlockedCount
        const justUnlocked = i === unlockedCount - 1
        return (
          <div key={section.id} className={`report-panel ${unlocked ? 'unlocked' : 'locked'}`}>
            <p className="mono caption" style={{ marginBottom: 'var(--sp-8)' }}>{section.label}</p>
            <p className="body" style={{ fontWeight: 500 }}>{section.title}</p>
            {justUnlocked && insight && (
              <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>{insight}</p>
            )}
          </div>
        )
      })}

      <button className="btn-cta" onClick={onContinue} style={{ marginTop: 'var(--sp-32)' }}>
        {isFinal ? 'See your report →' : 'Continue →'}
      </button>
    </div>
  )
}
