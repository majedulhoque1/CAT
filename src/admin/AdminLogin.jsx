import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message || 'Unable to sign in.')
    }
    // On success, AdminApp's onAuthStateChange swaps this screen for the dashboard.
  }

  return (
    <div className="wrap surface-paper app">
      <div className="fu">
        <p className="eyebrow" style={{ marginBottom: 'var(--sp-16)' }}>thriveABL</p>
        <h1 className="hero-title" style={{ marginBottom: 'var(--sp-8)' }}>Admin portal.</h1>
        <p className="body" style={{ color: 'var(--muted)', marginBottom: 'var(--sp-24)' }}>
          Sign in to review submissions and bookings.
        </p>

        <form className="panel" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: 'var(--sp-16)' }}>
            <label className="field">
              <span>Email</span>
              <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="email" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input className="field-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
            </label>
          </div>

          {error && <p className="caption" style={{ marginTop: 'var(--sp-16)' }}>{error}</p>}

          <button className="btn-cta" type="submit" disabled={loading} style={{ marginTop: 'var(--sp-16)' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
