import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'
import { SITE } from '../content/site'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-in">
        <div>
          <span style={{ display: 'flex', marginLeft: 'calc(var(--sp-16) * -1)' }}>
            <BrandMark size={16} />
          </span>
          <p className="caption" style={{ marginTop: 'var(--sp-8)' }}>
            {SITE.footerTagline}
          </p>
          {/* Staff entrance. Deliberately the quietest thing on the page — it is
              a door for Samir, not a call to action for visitors. */}
          <Link to="/admin" className="footer-admin">
            Admin
          </Link>
        </div>

        <div style={{ display: 'grid', gap: 'var(--sp-16)' }}>
          <div className="footer-links">
            {SITE.nav.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
          <p className="caption">{SITE.footerLegal}</p>
          <a
            className="caption"
            href={SITE.linkedin}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--muted)' }}
          >
            LinkedIn ↗
          </a>
        </div>
      </div>
    </footer>
  )
}
