// Text-rendered stand-in for the thriveABL wordmark (light, wide-tracked
// geometric sans, "ABL" set larger — matching the supplied logo). Swap for the
// real SVG the moment it's available: replace this component's contents with
// an <img>/<svg> and every call site (Landing, PDF header, share card) updates
// for free.
export default function Wordmark({ size = 20 }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 300,
        fontSize: size,
        letterSpacing: '0.14em',
        textTransform: 'lowercase',
        color: 'inherit',
      }}
    >
      thrive<span style={{ textTransform: 'uppercase', fontWeight: 400 }}>ABL</span>
    </span>
  )
}
