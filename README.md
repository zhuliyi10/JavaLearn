# JavaLearn

一个前后端分离的用户管理系统，用于学习 Spring Boot 全栈开发与 React 前端工程化。后端提供注册 / 登录（JWT）和用户 CRUD 接口，前端实现路由守卫与登录态管理，配套一份与代码一一对应的学习文档。

## 技术栈

| 端 | 技术 |
|------|------|
| 后端 | Java 21+、Spring Boot 3、Spring Security + JWT、Spring Data JPA、H2（开发）/ PostgreSQL（生产）、Maven |
| 前端 | React 19、Vite、react-router-dom、原生 fetch 封装 |

## 项目结构

```
JavaLearn/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/com/example/
│   │   ├── controller/         # Auth（注册/登录）、User（CRUD）接口
│   │   ├── service/            # 业务逻辑、JWT 发放
│   │   ├── repository/         # JPA 数据访问
│   │   ├── config/             # Security 配置、JWT 过滤器
│   │   └── ...
│   ├── LEARNING.md             # 学习文档（第 1-14 章讲后端，第 15 章讲前端）
│   └── docker-compose.yml      # 本地完整环境（应用 + PostgreSQL）
└── frontend/                   # React + Vite 前端（独立工程）
    └── src/
        ├── AuthContext.jsx     # 登录态管理（token 存 localStorage）
        ├── RequireAuth.jsx     # 路由守卫：未登录跳 /login
        ├── api.js              # 统一 fetch 封装（自动携带 JWT）
        └── pages/              # Login / Register / Users
```

## 快速启动

前提：JDK 21+、Maven 3.9+、Node 18+。

前后端是两个独立进程，开两个终端：

```bash
# 终端 1：后端（8080 端口，默认 H2 内存库，无需装数据库）
cd backend
mvn spring-boot:run

# 终端 2：前端（5173 端口）
cd frontend
npm install    # 首次运行前安装依赖
npm run dev
```

浏览器打开 `http://localhost:5173/`，未登录会被路由守卫重定向到登录页；先注册一个账号（登录页预填的 `alice@example.com / 123456` 是方便本地测试的默认值）。开发期前端请求经 Vite 代理转发到 8080，不存在跨域问题。

> 注意：开发库是 H2 内存库，重启后端后数据清空。

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（无需 token） |
| POST | `/api/auth/login` | 登录，返回 JWT（无需 token） |
| GET / POST | `/api/users` | 用户列表 / 新增（需 `Authorization: Bearer <token>`） |
| DELETE | `/api/users/{id}` | 删除用户（需 token） |

错误统一返回 `{status, message, timestamp}` 格式。

## 测试与构建

```bash
# 后端测试 / 打包
cd backend && mvn test
cd backend && mvn clean package -DskipTests

# 前端构建（产物在 dist/）
cd frontend && npm run build
```

生产部署：前端 `dist/` 交由 Nginx 托管并把 `/api` 反向代理到后端；后端可用 `docker-compose.yml` 一键起应用 + PostgreSQL。

## 学习文档

详细的设计取舍和知识点见 [backend/LEARNING.md](backend/LEARNING.md)：分层架构、JPA 实体映射、Spring Security + JWT 认证链路、统一异常处理、测试写法，以及第 15 章的前端路由守卫与登录态管理。
