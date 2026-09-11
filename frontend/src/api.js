// 统一封装 fetch：自动带 JWT、统一解析后端 {status, message, timestamp} 错误格式。
// 401/403 抛出特殊标记，交给上层（AuthContext）触发登出。

const TOKEN_KEY = 'token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token

  const res = await fetch(path, { ...options, headers })

  if (res.status === 401 || res.status === 403) {
    throw new ApiError('登录已过期，请重新登录', res.status)
  }
  if (res.status === 204) return null // DELETE 无响应体

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(data?.message || `请求失败：${res.status}`, res.status)
  }
  return data
}

export const api = {
  register: (body) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  listUsers: () => request('/api/users'),
  createUser: (body) =>
    request('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
}
