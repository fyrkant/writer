import { useState } from 'react'

interface Props {
  onLogin: (token: string) => void
  error: boolean
}

export default function Login({ onLogin, error }: Props) {
  const [password, setPassword] = useState('')

  const submit = () => {
    if (password) onLogin(password)
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
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={submit}>
            Enter
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
