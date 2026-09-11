import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { api, getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // 初始值直接从 localStorage 读，这样刷新页面后登录态还在
  const [token, setTokenState] = useState(() => getToken())
  const [email, setEmail] = useState(() => localStorage.getItem('email'))

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials)
    setToken(data.token)
    localStorage.setItem('email', data.email)
    setTokenState(data.token)
    setEmail(data.email)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('email')
    setTokenState(null)
    setEmail(null)
  }, [])

  const value = useMemo(
    () => ({ token, email, isLoggedIn: !!token, login, logout }),
    [token, email, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内部使用')
  return ctx
}
