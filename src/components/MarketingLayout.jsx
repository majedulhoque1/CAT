import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

// Every public company page shares this shell. Marketing runs on surface-ink;
// the assessment, report and admin stay surface-paper. Crossing between the two
// is the brand's one dramatic move, and it now marks the boundary between
// "being sold to" and "using the instrument".
// `surface` exists for /book: it wears the site chrome because it is a
// navigable conversion page, but it belongs to the instrument side of the
// brand, so it stays on paper.
export default function MarketingLayout({ children, surface = 'ink' }) {
  return (
    <div className={`surface-${surface} app`}>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  )
}
