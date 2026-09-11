import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { isLoggedIn, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('alice@example.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // 已登录的人访问 /login 没有意义，直接送回列表页
  if (isLoggedIn) return <Navigate to="/users" replace />

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login({ email, password })
      // 守卫记下的原始目标；直接进 /login 的话就默认去 /users
      navigate(location.state?.from || '/users', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card narrow">
      <h2>登录</h2>
      {error && <div className="msg error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>
          邮箱
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? '登录中…' : '登录'}
        </button>
      </form>
      <p className="hint">
        还没有账号？<Link to="/register">去注册</Link>
      </p>
    </div>
  )
}
