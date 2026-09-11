import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 开发时前端跑在 5173，后端在 8080。浏览器直接跨端口请求会触发 CORS，
    // 这里让 Vite 把 /api 开头的请求转发到后端，浏览器看到的仍是同源请求，绕开跨域。
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
