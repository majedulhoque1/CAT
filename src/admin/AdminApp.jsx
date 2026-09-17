import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import AdminSubmissionDetail from './AdminSubmissionDetail'
import AdminBookings from './AdminBookings'
import AdminAvailability from './AdminAvailability'

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(() => !supabase)

  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (!supabase) {
    return (
      <div className="wrap surface-paper app">
        <div className="panel">
          <p className="caption">
            Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.
          </p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!session) {
    return <AdminLogin />
  }

  return (
    <div className="surface-paper app" style={{ minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<AdminDashboard session={session} />} />
        <Route path="submissions/:submissionId" element={<AdminSubmissionDetail />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="availability" element={<AdminAvailability />} />
      </Routes>
    </div>
  )
}
