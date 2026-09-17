import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import BrandMark from './BrandMark'
import { SITE } from '../content/site'

export default function SiteHeader() {
  const rail = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // A route change is the visitor telling us where they wanted to go — close
  // the drawer for them instead of leaving it open over the new page.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  // Deliberately not GSAP. SiteHeader is in every marketing page's shared
  // chunk, so importing GSAP here would drag ~45kB gzip onto /book and the
  // static pages for one hairline. A passive listener writing one transform
  // costs nothing and behaves identically.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    function update() {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const progress = max > 0 ? doc.scrollTop / max : 0
      if (rail.current) rail.current.style.transform = `scaleX(${progress})`
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <header className="site-header">
      <div className="site-header-in">
        <Link to="/" aria-label={`${SITE.brandName} home`} className="brand-link">
          <BrandMark size={18} />
        </Link>

        <nav id="site-nav" className={`site-nav${menuOpen ? ' is-open' : ''}`}>
          {SITE.nav.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
          {/* Duplicate of the header nav-cta below, shown only in the drawer
              (<900px) — the header bar stays brand+toggle only on mobile so
              the label never fights the toggle for width. */}
          <Link to={SITE.navCta.to} className="nav-cta nav-cta-drawer">
            {SITE.navCta.label}
            <span aria-hidden="true" style={{ color: 'var(--signal)' }}>→</span>
          </Link>
        </nav>

        <Link to={SITE.navCta.to} className="nav-cta nav-cta-header">
          {SITE.navCta.label}
          <span aria-hidden="true" style={{ color: 'var(--signal)' }}>→</span>
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
        </button>
      </div>
      <i className="scroll-rail" ref={rail} />
    </header>
  )
}
