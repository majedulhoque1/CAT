// Generates a downloadable .ics calendar invite for a booked Discovery Call.
// V1 books in a single timezone (Asia/Dhaka, UTC+6, no DST) — see the plan's
// open item if a second timezone is ever needed.
function pad(n) {
  return String(n).padStart(2, '0')
}

function formatIcsUtc(ms) {
  const dt = new Date(ms)
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`
}

function escapeIcsText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// date: 'YYYY-MM-DD', time: 'HH:MM' or 'HH:MM:SS', both Asia/Dhaka wall-clock.
export function buildIcs({ date, time, durationMinutes = 30, title, description, url }) {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const startMs = Date.UTC(y, m - 1, d, hh - 6, mm)
  const endMs = startMs + durationMinutes * 60 * 1000
  const stamp = formatIcsUtc(Date.now())

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//thriveABL//Discovery Call//EN',
    'BEGIN:VEVENT',
    `UID:thriveabl-${startMs}@thriveabl.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${formatIcsUtc(startMs)}`,
    `DTEND:${formatIcsUtc(endMs)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    url ? `URL:${url}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

export function downloadIcs(icsContent, filename = 'thriveabl-discovery-call.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
