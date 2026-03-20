import { useState } from 'react'
import { apiFetch } from '../api'

interface Props {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!password || loading) return
    setLoading(true)
    setError(false)
    try {
      await apiFetch('/api/auth', password)
      onLogin(password)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div id="login-screen">
      <div className="login-box">
        <h1>blog<span>.</span>editor</h1>
        <label>
          <span className="label-text">Password</span>
          <input
            type="password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </label>
        <div style={{ marginTop: '16px' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit} disabled={loading}>
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--danger)' }}>
            Wrong password.
          </div>
        )}
      </div>
    </div>
  )
}
