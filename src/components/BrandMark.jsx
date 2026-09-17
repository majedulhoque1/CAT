import Wordmark from './Wordmark'

// The thriveABL logo lockup: the wordmark inside its four corner registration
// brackets, per the supplied artwork — with "STUDIO" omitted, as requested.
//
// Reproduced in markup rather than as a raster because both halves already
// exist in the design system (.reg-mark is these brackets; Wordmark is these
// letterforms). That means it is resolution-independent, inverts for free
// between surface-ink and surface-paper via currentColor, and costs no
// network request.
//
// To use the original artwork instead: drop the file in /public and replace
// this component's body with an <img>. Every call site updates for free.
export default function BrandMark({ size = 18 }) {
  return (
    <span className="brand-lockup" style={{ color: 'inherit' }}>
      <i className="bl-c tl" />
      <i className="bl-c tr" />
      <i className="bl-c bl" />
      <i className="bl-c br" />
      <Wordmark size={size} />
    </span>
  )
}
