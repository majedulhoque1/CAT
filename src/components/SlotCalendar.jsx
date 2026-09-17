import { useMemo, useState } from 'react'

// Times per day shown before the "+N more" expander. Six is roughly one
// column-height; the previous build rendered all sixteen for all ten days,
// which was 160 buttons and read as "unlimited availability" — the opposite of
// what a capped calendar is meant to communicate.
const TIMES_VISIBLE = 6
const DAYS_VISIBLE = 5

function dowLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`)
    .toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
    .toUpperCase()
}
function dayNum(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', timeZone: 'UTC' })
}
function monthLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`)
    .toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()
}
function timeLabel(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'pm' : 'am'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')}${period}`
}

/**
 * The discovery-session calendar, in both its states.
 *
 * One component for locked and unlocked so the two can never drift: the gated
 * visitor sees exactly the calendar they will get, which is the entire point of
 * showing it rather than describing it.
 */
export default function SlotCalendar({ days, locked = false, selected, onSelect }) {
  const [expandedDay, setExpandedDay] = useState(null)
  const [showAllDays, setShowAllDays] = useState(false)

  const visibleDays = useMemo(
    () => (showAllDays ? days : days.slice(0, DAYS_VISIBLE)),
    [days, showAllDays],
  )

  if (!days.length) {
    return (
      <p className="body" style={{ color: 'var(--muted)' }}>
        No sessions open in the next two weeks — check back soon.
      </p>
    )
  }

  return (
    <div>
      <div className="cal-wrap">
        {locked && (
          // Frosted badge over the dimmed grid. The lock has to be a visible
          // object, not just reduced opacity — a faded table with struck-out
          // times reads as "broken/unavailable", whereas a lock reads as
          // "earn this", which is the whole argument of the gate.
          <div className="cal-lock" aria-hidden="true">
            <span className="cal-lock-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="10.5" width="16" height="10" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 10.5V7a4 4 0 1 1 8 0v3.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              Locked
            </span>
          </div>
        )}
        <div className={`cal${locked ? ' is-locked' : ''}`}>
        {visibleDays.map(([date, times]) => {
          const isExpanded = expandedDay === date
          const shown = isExpanded ? times : times.slice(0, TIMES_VISIBLE)
          const hidden = times.length - shown.length

          return (
            <div className="cal-day" key={date}>
              <div className="cal-head">
                <p className="cal-dow mono">{dowLabel(date)}</p>
                <p className="cal-date mono">{dayNum(date)}</p>
                <p className="cal-dow mono">{monthLabel(date)}</p>
              </div>

              <div className="cal-times">
                {shown.map((time) => {
                  const isSel = selected?.date === date && selected?.time === time
                  return (
                    <button
                      key={time}
                      type="button"
                      className={`cal-slot${isSel ? ' sel' : ''}`}
                      disabled={locked}
                      onClick={locked ? undefined : () => onSelect({ date, time })}
                      aria-label={
                        locked
                          ? `${timeLabel(time)} — locked until you complete the assessment`
                          : `Book ${timeLabel(time)}`
                      }
                    >
                      {timeLabel(time)}
                    </button>
                  )
                })}

                {hidden > 0 && (
                  <button
                    type="button"
                    className="cal-more"
                    onClick={() => setExpandedDay(isExpanded ? null : date)}
                  >
                    +{hidden}
                  </button>
                )}
                {isExpanded && (
                  <button type="button" className="cal-more" onClick={() => setExpandedDay(null)}>
                    Less
                  </button>
                )}
              </div>
            </div>
            )
          })}
        </div>
      </div>

      {days.length > DAYS_VISIBLE && (
        <button
          type="button"
          className="cal-expand"
          onClick={() => setShowAllDays((v) => !v)}
        >
          {showAllDays
            ? 'Show fewer dates'
            : `Show ${days.length - DAYS_VISIBLE} more dates`}
        </button>
      )}
    </div>
  )
}
