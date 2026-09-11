import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, api } from '../api'
import { useAuth } from '../AuthContext'

export default function Users() {
  const { email, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  // token 过期时后端返回 401/403，这里清掉本地登录态并回到登录页，
  // 否则守卫仍然认为「已登录」，页面会卡在一直报错的状态。
  const handleError = useCallback(
    (err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message)
    },
    [logout, navigate],
  )

  const load = useCallback(async () => {
    try {
      setUsers(await api.listUsers())
    } catch (err) {
      handleError(err)
    }
  }, [handleError])

  useEffect(() => {
    load()
  }, [load])

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    try {
      await api.createUser(form)
      setForm({ name: '', email: '', password: '' })
      load()
    } catch (err) {
      handleError(err)
    }
  }

  async function onDelete(id) {
    if (!confirm('确认删除该用户？')) return
    try {
      await api.deleteUser(id)
      load()
    } catch (err) {
      handleError(err)
    }
  }

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  return (
    <>
      <div className="user-bar">
        <span>
          当前登录：<strong>{email}</strong>
        </span>
        <button className="secondary" onClick={logout}>
          退出登录
        </button>
      </div>

      {error && <div className="msg error">{error}</div>}

      <div className="card">
        <h2>新增用户</h2>
        <form className="row" onSubmit={onCreate}>
          <input placeholder="姓名" value={form.name} onChange={update('name')} required />
          <input
            type="email"
            placeholder="邮箱"
            value={form.email}
            onChange={update('email')}
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={form.password}
            onChange={update('password')}
            required
          />
          <button type="submit">创建</button>
        </form>
      </div>

      <div className="card">
        <h2>用户列表</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>邮箱</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <button className="danger" onClick={() => onDelete(u.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="empty">暂无用户</div>}
      </div>
    </>
  )
}
