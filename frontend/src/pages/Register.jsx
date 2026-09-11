import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.register(form)
      // 注册接口只创建用户、不发 token，所以注册完还得走一次登录
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card narrow">
      <h2>注册</h2>
      {error && <div className="msg error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label>
          姓名
          <input value={form.name} onChange={update('name')} required />
        </label>
        <label>
          邮箱
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          密码
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            required
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? '提交中…' : '注册'}
        </button>
      </form>
      <p className="hint">
        已有账号？<Link to="/login">去登录</Link>
      </p>
    </div>
  )
}
