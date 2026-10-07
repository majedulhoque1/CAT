import { useId } from 'react'

// Renders an item's stimulus: plain text, a table, or a bar/line chart drawn
// as inline SVG. Monochrome on purpose (the design system keeps darkness from
// encoding category or magnitude). Every chart carries its data as a table in
// a <details> so screen-reader users are never blocked by the picture.

// A narrow canvas keeps SVG text legible when the chart scales down to a phone.
const W = 420
const H = 260
const M = { left: 38, right: 12, top: 26, bottom: 34 }

function niceStep(range, targetTicks = 5) {
  const raw = range / targetTicks
  const pow = 10 ** Math.floor(Math.log10(raw))
  const f = raw / pow
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
}

function scaleFor(values, yMin, yMax) {
  const lo = yMin ?? 0
  const hi = yMax ?? Math.max(...values) * 1.12
  const step = niceStep(hi - lo)
  const top = Math.ceil(hi / step) * step
  const ticks = []
  for (let v = Math.ceil(lo / step) * step; v <= top + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000)
  return { lo, hi: top, ticks }
}

function DataTable({ stimulus }) {
  const s = stimulus.series[0]
  return (
    <table className="stimulus-table">
      <caption>{stimulus.title}</caption>
      <thead>
        <tr><th scope="col">Category</th><th scope="col">{s.name}</th></tr>
      </thead>
      <tbody>
        {stimulus.categories.map((c, i) => (
          <tr key={c}><td>{c}</td><td>{s.values[i]}</td></tr>
        ))}
      </tbody>
    </table>
  )
}

function Chart({ stimulus }) {
  const titleId = useId()
  const values = stimulus.series[0].values
  const { lo, hi, ticks } = scaleFor(values, stimulus.yMin, stimulus.yMax)
  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom
  const y = (v) => M.top + plotH - ((v - lo) / (hi - lo)) * plotH
  const n = stimulus.categories.length
  const band = plotW / n
  const x = (i) => M.left + band * i + band / 2

  return (
    <>
      <p className="chart-title mono" id={titleId}>{stimulus.title}</p>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={titleId}
        preserveAspectRatio="xMidYMid meet"
      >
        <text x={M.left} y={14} className="chart-axis-label">{stimulus.yLabel}</text>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={t === lo ? 0.9 : 0.15} strokeWidth="1" />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="chart-tick">{t}</text>
          </g>
        ))}

        {stimulus.type === 'bar' && values.map((v, i) => {
          const bw = Math.min(band * 0.6, 64)
          return (
            <g key={stimulus.categories[i]}>
              <rect x={x(i) - bw / 2} y={y(v)} width={bw} height={Math.max(0, y(lo) - y(v))} fill="currentColor" />
              <text x={x(i)} y={y(v) - 6} textAnchor="middle" className="chart-value">{v}</text>
            </g>
          )
        })}

        {stimulus.type === 'line' && (
          <>
            <polyline
              fill="none" stroke="currentColor" strokeWidth="1.5"
              points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
            {values.map((v, i) => (
              <g key={stimulus.categories[i]}>
                <circle cx={x(i)} cy={y(v)} r="3" fill="currentColor" />
                <text x={x(i)} y={y(v) - 9} textAnchor="middle" className="chart-value">{v}</text>
              </g>
            ))}
          </>
        )}

        {stimulus.categories.map((c, i) => (
          <text key={c} x={x(i)} y={H - M.bottom + 18} textAnchor="middle" className="chart-tick">{c}</text>
        ))}
      </svg>
      <details className="chart-details">
        <summary>View the data as a table</summary>
        <div className="stimulus-scroll"><DataTable stimulus={stimulus} /></div>
      </details>
    </>
  )
}

export default function StimulusChart({ stimulus }) {
  if (!stimulus) return null
  return (
    <div className="stimulus">
      {stimulus.type === 'text' && <p className="body">{stimulus.body}</p>}
      {stimulus.type === 'table' && (
        <div className="stimulus-scroll">
          <table className="stimulus-table">
            <caption>{stimulus.caption}</caption>
            <thead>
              <tr>{stimulus.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
            </thead>
            <tbody>
              {stimulus.rows.map((row) => (
                <tr key={row[0]}>{row.map((cell, i) => <td key={`${row[0]}-${i}`}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(stimulus.type === 'bar' || stimulus.type === 'line') && <Chart stimulus={stimulus} />}
    </div>
  )
}
