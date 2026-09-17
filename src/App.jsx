import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { CSS } from './styles'

// Lazy: the assessment/admin bundle shouldn't ship to a visitor who only
// reads the landing page.
const Landing = lazy(() => import('./pages/Landing'))
const AssessmentApp = lazy(() => import('./AssessmentApp'))
const PublicReport = lazy(() => import('./pages/PublicReport'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const AdminApp = lazy(() => import('./admin/AdminApp'))

function RouteFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="wrap surface-paper app fu">
      <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>404</p>
      <h1 className="hero-title" style={{ marginBottom: 'var(--sp-32)' }}>Page not found.</h1>
      <Link to="/" className="link-signal">
        Back to the homepage
        <span className="arw" aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <>
      <style>{CSS}</style>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* ---- product ---- */}
            <Route path="/" element={<Landing />} />
            <Route path="/cat/take" element={<AssessmentApp />} />
            <Route path="/r/:token" element={<PublicReport />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/admin/*" element={<AdminApp />} />

            {/* CAT was never deployed publicly, but this path was shared during
                testing — costs nothing to keep it working. */}
            <Route path="/assessment" element={<Navigate to="/cat/take" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  )
}
