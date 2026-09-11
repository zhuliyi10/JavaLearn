import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Users from './pages/Users'
import './App.css'

export default function App() {
  return (
    <div className="container">
      <h1>用户管理系统</h1>
      <p className="subtitle">React + Vite 前端，对接 Spring Boot JWT 后端</p>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/users"
          element={
            <RequireAuth>
              <Users />
            </RequireAuth>
          }
        />
        {/* 兜底：未匹配的路径都送去 /users，没登录的话守卫会再把人转到 /login */}
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </div>
  )
}
