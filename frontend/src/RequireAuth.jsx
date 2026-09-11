import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

// 路由守卫：没登录就重定向到 /login。
// state 里记下用户原本想去的地址，登录成功后可以跳回去，而不是一律回首页。
export default function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
