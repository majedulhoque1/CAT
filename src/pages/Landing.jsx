import { Link } from 'react-router-dom'
import MarketingLayout from '../components/MarketingLayout'
import LiquidButton from '../components/LiquidButton'
import { LANDING_CONTENT as C } from '../content/landing'

// The CAT product page. Lives at /cat — the company homepage is now "/".
// Header, footer and registration marks come from MarketingLayout; this file
// is only the product argument.
export default function Landing() {
  return (
    <MarketingLayout>
      <div className="mkt">
        {/* ---- Hero ---- */}
        <section className="sec">
          <p className="eyebrow" style={{ marginBottom: 'var(--sp-24)' }}>{C.eyebrow}</p>
          <h1 className="display-fluid" style={{ marginBottom: 'var(--sp-32)', maxWidth: '14ch' }}>
            {C.heroTitle}
          </h1>
          <p className="body measure" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-32)' }}>
            {C.heroSubtitle}
          </p>

          <div className="meta-row" style={{ marginBottom: 'var(--sp-32)' }}>
            {C.heroMeta.map((m) => (
              <span key={m} className="meta-chip">{m}</span>
            ))}
          </div>

          <LiquidButton to="/cat/take">{C.heroCta} →</LiquidButton>
        </section>

        {/* ---- What it measures ---- */}
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <p className="eyebrow">{C.whatItMeasuresEyebrow}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-32)' }}>
            {C.sections.map((s) => (
              <div key={s.num} style={{ borderTop: '1px solid var(--on-surface)', paddingTop: 'var(--sp-16)' }}>
                <p className="mono caption" style={{ marginBottom: 'var(--sp-8)' }}>{s.num}</p>
                <p className="body" style={{ fontWeight: 500, marginBottom: 'var(--sp-4)' }}>{s.title}</p>
                <p className="caption">{s.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- How it works ---- */}
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <p className="eyebrow">{C.howItWorksEyebrow}</p>
          </div>
          <div style={{ display: 'grid', gap: 'var(--sp-32)' }}>
            {C.steps.map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: 'var(--sp-24)', alignItems: 'baseline' }}>
                <span className="mono" style={{ fontSize: 'var(--fs-32)', color: 'var(--muted)', flexShrink: 0, width: 48 }}>
                  {step.num}
                </span>
                <div className="measure">
                  <p className="body" style={{ fontWeight: 500, marginBottom: 'var(--sp-4)' }}>{step.title}</p>
                  <p className="caption">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---- FAQ ---- */}
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="sec-head">
            <p className="eyebrow">{C.faqEyebrow}</p>
          </div>
          <div className="measure">
            {C.faq.map((item, i) => (
              <div
                key={item.q}
                style={{
                  padding: 'var(--sp-24) 0',
                  borderBottom: i < C.faq.length - 1 ? '1px solid var(--rule)' : 'none',
                }}
              >
                <p className="body" style={{ fontWeight: 500, marginBottom: 'var(--sp-8)' }}>{item.q}</p>
                <p className="caption">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- Final CTA ---- */}
        <section className="sec" style={{ paddingTop: 0, textAlign: 'center' }}>
          <h2 className="hero-fluid" style={{ marginBottom: 'var(--sp-32)' }}>{C.finalCtaTitle}</h2>
          <LiquidButton to="/cat/take">{C.finalCta} →</LiquidButton>
        </section>
      </div>
    </MarketingLayout>
  )
}
