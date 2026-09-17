import { useRef } from 'react'
import { Link } from 'react-router-dom'

// Primary CTA with a liquid fill on hover: an ink blob grows from wherever the
// cursor entered, and the label crossfades to the surface colour on top of it.
//
// Built with CSS transitions + two custom properties, NOT GSAP. This button
// appears on /cat and /services, which otherwise ship no animation library —
// importing GSAP here would pull ~45kB gzip into those chunks for one hover
// effect (the same mistake already made once with SiteHeader's scroll rail).
//
// The "liquid" reading comes from the silhouette, not from a filter: the blob
// has an asymmetric border-radius that morphs as it expands, then keeps a slow
// wobble while hovered. An SVG feTurbulence goo filter would cost a per-frame
// raster pass and soften the text edges sitting on top of it.
export default function LiquidButton({ to, href, children, className = '', onClick, ...rest }) {
  const ref = useRef(null)

  // Origin the blob on the pointer so the fill feels like it follows the hand
  // in from whichever edge the cursor crossed.
  function positionFill(event) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--lx', `${event.clientX - r.left}px`)
    el.style.setProperty('--ly', `${event.clientY - r.top}px`)
  }

  const inner = (
    <>
      <span className="lq-fill" aria-hidden="true" />
      <span className="lq-label">{children}</span>
    </>
  )

  const shared = {
    ref,
    className: `btn-cta btn-inline lq ${className}`,
    onPointerEnter: positionFill,
    // Also on leave, so the blob retracts toward the exit edge rather than
    // snapping back to where it came in.
    onPointerLeave: positionFill,
    ...rest,
  }

  if (to) return <Link to={to} {...shared}>{inner}</Link>
  if (href) return <a href={href} {...shared}>{inner}</a>
  return <button type="button" onClick={onClick} {...shared}>{inner}</button>
}
