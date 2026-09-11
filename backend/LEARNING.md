# Java 后端开发学习文档

本文档对应整个学习项目：第 1-14 章讲解 `backend/` 下的 Spring Boot 项目，第 15 章讲解 `frontend/` 下的独立 React + Vite 前端工程，每个章节与代码一一对应。

---

## 目录

1. [项目结构](#1-项目结构)
2. [快速启动](#2-快速启动)
3. [核心依赖说明](#3-核心依赖说明)
4. [分层架构](#4-分层架构)
5. [数据模型层 Model](#5-数据模型层-model)
6. [数据访问层 Repository](#6-数据访问层-repository)
7. [业务逻辑层 Service](#7-业务逻辑层-service)
8. [接口层 Controller](#8-接口层-controller)
9. [认证与授权 Security + JWT](#9-认证与授权-security--jwt)
10. [统一异常处理](#10-统一异常处理)
11. [配置文件详解](#11-配置文件详解)
12. [测试](#12-测试)
13. [打包与部署](#13-打包与部署)
14. [API 接口汇总](#14-api-接口汇总)
15. [前端工程（React + Vite）](#15-前端工程react--vite)

---

## 1. 项目结构

```
backend/
├── pom.xml                                        # Maven 依赖和构建配置
├── Dockerfile                                     # Docker 镜像构建
├── docker-compose.yml                             # 本地完整环境（应用 + PostgreSQL）
└── src/
    ├── main/
    │   ├── java/com/example/
    │   │   ├── Application.java                   # 启动入口
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java            # Spring Security 配置
    │   │   │   └── JwtFilter.java                 # JWT 请求过滤器
    │   │   ├── controller/
    │   │   │   ├── AuthController.java            # 注册 / 登录接口
    │   │   │   └── UserController.java            # 用户 CRUD 接口
    │   │   ├── exception/
    │   │   │   ├── GlobalExceptionHandler.java    # 全局错误处理
    │   │   │   └── ResourceNotFoundException.java # 自定义 404 异常
    │   │   ├── model/
    │   │   │   ├── User.java                      # JPA 实体（对应数据库表）
    │   │   │   └── dto/
    │   │   │       ├── CreateUserRequest.java     # 创建/更新用户的入参
    │   │   │       ├── LoginRequest.java          # 登录入参
    │   │   │       ├── LoginResponse.java         # 登录出参（含 token）
    │   │   │       └── UserResponse.java          # 用户出参（不含密码）
    │   │   ├── repository/
    │   │   │   └── UserRepository.java            # 数据库操作接口
    │   │   ├── service/
    │   │   │   ├── AuthService.java               # 登录 / JWT 发放
    │   │   │   └── UserService.java               # 用户业务逻辑
    │   │   └── util/
    │   │       └── JwtUtil.java                   # JWT 生成 / 验证工具
    │   └── resources/
    │       ├── application.properties             # 开发环境配置（H2 内存库）
    │       └── application-prod.properties        # 生产环境配置（PostgreSQL）
    └── test/
        └── java/com/example/
            ├── controller/UserControllerTest.java # Controller 集成测试
            └── service/UserServiceTest.java       # Service 单元测试

frontend/                                          # 独立前端工程（React + Vite，详见第 15 节）
├── index.html                                     # SPA 唯一的 HTML 页面
├── package.json                                   # 前端依赖（vite、react、react-router-dom）
├── vite.config.js                                 # Vite 配置（/api 代理到后端 8080）
└── src/
    ├── main.jsx                                   # 入口：挂载 Router 和 AuthProvider
    ├── App.jsx                                    # 路由表
    ├── api.js                                     # 统一 fetch 封装（自动携带 JWT）
    ├── AuthContext.jsx                            # 登录态管理（token 存 localStorage）
    ├── RequireAuth.jsx                            # 路由守卫：未登录跳 /login
    └── pages/
        ├── Login.jsx                              # 登录页
        ├── Register.jsx                           # 注册页
        └── Users.jsx                              # 用户列表页（受保护路由）
```

---

## 2. 快速启动

### 前提
- JDK 21+（或系统已有 JDK，如本机的 JDK 26 也可用）
- Maven 3.9+（已通过 Homebrew 安装在 `/opt/homebrew/bin/mvn`）

### 启动开发服务器

前后端是两个独立进程，需要开两个终端：

```bash
# 终端 1：后端（8080 端口）
cd backend
/opt/homebrew/bin/mvn spring-boot:run

# 终端 2：前端（5173 端口）
cd frontend
npm install    # 首次运行前安装依赖
npm run dev
```

服务启动后访问：
- 前端页面：`http://localhost:5173/`
- API 根路径：`http://localhost:8080`（前端开发时经 Vite 代理转发到后端，见第 15 节）
- H2 数据库控制台：`http://localhost:8080/h2-console`
  - JDBC URL：`jdbc:h2:mem:testdb`
  - 用户名：`sa`，密码为空

### 运行测试

```bash
/opt/homebrew/bin/mvn test
```

### 打包

```bash
/opt/homebrew/bin/mvn clean package -DskipTests
/opt/homebrew/opt/openjdk/bin/java -jar target/backend-1.0.0.jar
```

> ⚠️ 本机 PATH 上的 `java` 是 JDK 18（Corretto），版本太低跑不了本项目编译出的 JAR（会报
> `UnsupportedClassVersionError: class file version 65.0`）。所以要用 Homebrew 装的 JDK 26 的完整路径。
> 想一劳永逸可以把它加到 PATH：
> ```bash
> export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
> ```

---

## 3. 核心依赖说明

查看 [pom.xml](pom.xml) 了解完整配置。

| 依赖 | 作用 |
|------|------|
| `spring-boot-starter-web` | 提供 HTTP 服务、JSON 序列化、内嵌 Tomcat |
| `spring-boot-starter-data-jpa` | JPA/Hibernate，将 Java 对象映射到数据库表 |
| `spring-boot-starter-security` | 认证、授权、过滤器链 |
| `h2` | 内存数据库，开发时不用安装任何数据库即可运行 |
| `postgresql` | 生产数据库驱动（运行时加载） |
| `jjwt-*` | JWT 令牌的生成与验证 |

**关键点**：`spring-boot-starter-parent` 统一管理所有依赖版本，子依赖只需声明 groupId + artifactId，不需要写版本号，避免版本冲突。

---

## 4. 分层架构

请求从客户端进来，经过以下层次处理后返回：

```
HTTP 请求
    │
    ▼
JwtFilter              ← 检查 Authorization 头，设置 SecurityContext
    │
    ▼
SecurityConfig         ← 决定该请求是否需要认证
    │
    ▼
Controller             ← 接收参数，调用 Service，返回 HTTP 响应
    │
    ▼
Service                ← 业务逻辑，事务控制，抛出业务异常
    │
    ▼
Repository             ← 数据库 CRUD（由 Spring Data JPA 自动实现）
    │
    ▼
Database（H2 / PostgreSQL）
```

**为什么要分层？**
- Controller 只管 HTTP，换成 WebSocket 或 CLI 时不用改 Service
- Service 只管业务规则，数据库换成 MongoDB 时不用改 Service
- 每层可以独立测试，互不影响

---

## 5. 数据模型层 Model

### 实体类：[User.java](src/main/java/com/example/model/User.java)

```java
@Entity          // 告诉 JPA：这个类对应一张数据库表
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // 自增主键
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)  // 邮箱唯一约束
    private String email;

    @Column(nullable = false)
    private String password;  // 存储的是 BCrypt 哈希，不是明文
}
```

**注意**：JPA 要求有无参构造器（`protected User() {}`），这是框架用反射创建对象时需要的。

### DTO（Data Transfer Object）

DTO 是用于传输数据的纯数据类，与实体类分开，好处是：
- 可以控制哪些字段暴露给客户端（如 `UserResponse` 不含密码字段）
- 入参和出参可以有不同结构

本项目使用 Java 16+ 的 `record` 语法定义 DTO，比传统 class 简洁很多：

```java
// src/main/java/com/example/model/dto/UserResponse.java
public record UserResponse(Long id, String name, String email) {
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }
}
```

`record` 自动生成构造器、getter、`equals`、`hashCode`、`toString`，不需要手写。

---

## 6. 数据访问层 Repository

查看 [UserRepository.java](src/main/java/com/example/repository/UserRepository.java)。

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
```

继承 `JpaRepository` 后，以下方法**免费获得**，不需要写实现：
- `findAll()` — 查所有
- `findById(id)` — 按 ID 查
- `save(entity)` — 新增或更新
- `deleteById(id)` — 按 ID 删除
- `existsById(id)` — 判断是否存在

`findByEmail` 是自定义方法，Spring Data JPA 根据方法名自动生成 SQL：`SELECT * FROM users WHERE email = ?`。

---

## 7. 业务逻辑层 Service

查看 [UserService.java](src/main/java/com/example/service/UserService.java) 和 [AuthService.java](src/main/java/com/example/service/AuthService.java)。

### 关键注解

```java
@Service           // 标记为 Spring Bean，可以被注入到其他组件
@Transactional     // 方法内所有数据库操作在同一个事务中，出错自动回滚
```

### 密码安全

```java
// 存储时加密
passwordEncoder.encode("明文密码")  // → "$2a$10$..." BCrypt 哈希

// 验证时比对
passwordEncoder.matches("明文密码", "$2a$10$...")  // → true/false
```

**绝对不要在数据库里存明文密码。** BCrypt 每次加密结果不同，但 `matches()` 能正确验证，这是因为盐值已经包含在哈希结果里。

### 业务异常

```java
// Service 层抛异常
throw new ResourceNotFoundException("User not found: " + id);
throw new IllegalArgumentException("Email already exists: " + email);

// GlobalExceptionHandler 捕获并转为 HTTP 响应，不需要在 Controller 处理
```

---

## 8. 接口层 Controller

查看 [UserController.java](src/main/java/com/example/controller/UserController.java) 和 [AuthController.java](src/main/java/com/example/controller/AuthController.java)。

### RESTful 设计原则

| 操作 | HTTP 方法 | 路径 | 返回状态码 |
|------|-----------|------|-----------|
| 获取所有用户 | GET | `/api/users` | 200 |
| 获取单个用户 | GET | `/api/users/{id}` | 200 / 404 |
| 创建用户 | POST | `/api/users` | 201 |
| 更新用户 | PUT | `/api/users/{id}` | 200 / 404 |
| 删除用户 | DELETE | `/api/users/{id}` | 204 |
| 注册 | POST | `/api/auth/register` | 201 |
| 登录 | POST | `/api/auth/login` | 200 |

### 构造器注入 vs 字段注入

```java
// 推荐：构造器注入
private final UserService userService;
public UserController(UserService userService) {
    this.userService = userService;
}

// 不推荐：字段注入（测试时难以替换依赖）
@Autowired
private UserService userService;
```

---

## 9. 认证与授权 Security + JWT

### 整体流程

```
客户端                          服务端
  │                               │
  │  POST /api/auth/login         │
  │  { email, password }  ───────▶│ 验证密码
  │                               │ 生成 JWT token
  │  { token: "eyJ..." }  ◀───────│
  │                               │
  │  GET /api/users               │
  │  Authorization: Bearer eyJ...─▶│ JwtFilter 验证 token
  │                               │ 设置当前用户身份
  │  [ {...}, {...} ]     ◀───────│ Controller 处理请求
```

### JWT 结构

JWT 由三部分组成，用 `.` 分隔：

```
eyJhbGciOiJIUzI1NiJ9          ← Header（算法信息，Base64 编码）
.eyJzdWIiOiJhbGljZSJ9         ← Payload（用户信息，Base64 编码，非加密）
.SflKxwRJSMeKKF2QT4fwpMeJf36  ← Signature（用密钥签名，防篡改）
```

**Payload 不加密**，任何人都能 Base64 解码看到内容，所以不要放敏感信息（如密码）。Signature 保证了令牌不被伪造。

### JwtUtil 核心方法

查看 [JwtUtil.java](src/main/java/com/example/util/JwtUtil.java)：

```java
// 生成 token，subject 是用户邮箱
jwtUtil.generate("alice@example.com")

// 验证 token 是否有效（签名正确且未过期）
jwtUtil.isValid(token)

// 从 token 中提取邮箱
jwtUtil.extractUsername(token)
```

### SecurityConfig 配置

查看 [SecurityConfig.java](src/main/java/com/example/config/SecurityConfig.java)：

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()  // 注册、登录不需要 token
    .requestMatchers("/h2-console/**").permitAll() // H2 控制台开放
    .anyRequest().authenticated()                  // 其余接口都需要 token
)
```

### jwt.secret 说明

`application.properties` 里的 `jwt.secret` 是一个 Base64 编码的 256-bit 密钥。

**生产环境必须替换**，可以用以下命令生成：

```bash
openssl rand -base64 32
```

生产环境通过环境变量注入，不要提交到代码仓库：

```bash
JWT_SECRET=你的密钥 java -jar app.jar
```

---

## 10. 统一异常处理

查看 [GlobalExceptionHandler.java](src/main/java/com/example/exception/GlobalExceptionHandler.java)。

`@RestControllerAdvice` 让这个类拦截所有 Controller 抛出的异常，统一返回格式：

```json
{
  "status": 404,
  "message": "User not found: 99",
  "timestamp": "2026-09-11T01:29:19Z"
}
```

**为什么不在每个 Controller 里写 try-catch？** 因为那样会有大量重复代码，而且忘记写的话就会把 Spring 默认的 HTML 错误页（包含堆栈信息）返回给客户端，存在信息泄漏风险。

---

## 11. 配置文件详解

### 开发环境：[application.properties](src/main/resources/application.properties)

```properties
# H2 内存数据库，应用重启后数据清空，无需安装任何数据库
spring.datasource.url=jdbc:h2:mem:testdb

# create-drop：启动时建表，关闭时删表。适合开发，生产用 validate
spring.jpa.hibernate.ddl-auto=create-drop

# 打印 SQL 语句，方便调试
spring.jpa.show-sql=true

# H2 浏览器控制台
spring.h2.console.enabled=true
```

### 生产环境：[application-prod.properties](src/main/resources/application-prod.properties)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mydb

# validate：只验证表结构，不修改数据库。生产环境数据库变更要走 migration 工具（如 Flyway）
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false   # 生产环境关掉，避免日志泄漏数据

# 通过环境变量注入敏感信息
spring.datasource.password=${DB_PASSWORD}
jwt.secret=${JWT_SECRET}
```

激活生产配置：

```bash
java -Dspring.profiles.active=prod -jar app.jar
# 或通过环境变量
SPRING_PROFILES_ACTIVE=prod java -jar app.jar
```

---

## 12. 测试

### Service 单元测试：[UserServiceTest.java](src/test/java/com/example/service/UserServiceTest.java)

```java
@ExtendWith(MockitoExtension.class)  // 启用 Mockito
class UserServiceTest {
    @Mock UserRepository userRepository;  // 用 Mock 替代真实数据库
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks UserService userService;  // 把 Mock 注入到 Service
```

**什么是 Mock？** 用一个假对象替代真实依赖，让测试只关注被测代码的逻辑，不依赖数据库、网络等外部资源。

### Controller 集成测试：[UserControllerTest.java](src/test/java/com/example/controller/UserControllerTest.java)

```java
@WebMvcTest(UserController.class)  // 只启动 Web 层，比 @SpringBootTest 更快
class UserControllerTest {
    @Autowired MockMvc mockMvc;     // 模拟 HTTP 请求
    @MockBean UserService userService;  // Mock Service 层
    @MockBean JwtUtil jwtUtil;          // Mock JWT 工具（Web 层需要）
```

`@WithMockUser` 注解模拟一个已登录用户，让受保护的接口在测试时能正常访问。

### 运行测试

```bash
/opt/homebrew/bin/mvn test

# 只运行某个测试类
/opt/homebrew/bin/mvn test -Dtest=UserServiceTest
```

---

## 13. 打包与部署

### 打包为 JAR

```bash
/opt/homebrew/bin/mvn clean package -DskipTests
# 输出：target/backend-1.0.0.jar（包含内嵌 Tomcat，可直接运行）
```

### Docker 构建

查看 [Dockerfile](Dockerfile)：

```bash
docker build -t backend:latest .
docker run -p 8080:8080 -e JWT_SECRET=xxx backend:latest
```

### docker-compose（应用 + 数据库）

查看 [docker-compose.yml](docker-compose.yml)：

```bash
docker compose up --build   # 首次启动
docker compose up -d        # 后台运行
docker compose down         # 停止
```

---

## 14. API 接口汇总

所有接口均以 `http://localhost:8080` 为根路径。

### 认证接口（无需 token）

**注册**
```
POST /api/auth/register
Content-Type: application/json

{ "name": "Alice", "email": "alice@example.com", "password": "123456" }

→ 201 Created
{ "id": 1, "name": "Alice", "email": "alice@example.com" }
```

**登录**
```
POST /api/auth/login
Content-Type: application/json

{ "email": "alice@example.com", "password": "123456" }

→ 200 OK
{ "token": "eyJ...", "email": "alice@example.com" }
```

### 用户接口（需要 token）

所有请求添加 Header：`Authorization: Bearer <登录返回的 token>`

```
GET    /api/users          → 200 用户列表
GET    /api/users/{id}     → 200 单个用户 / 404
POST   /api/users          → 201 创建用户
PUT    /api/users/{id}     → 200 更新用户 / 404
DELETE /api/users/{id}     → 204 删除用户 / 404
```

### 错误响应格式

```json
{
  "status": 400,
  "message": "Email already exists: alice@example.com",
  "timestamp": "2026-09-11T01:29:19Z"
}
```

---

## 15. 前端工程（React + Vite）

前端是 `frontend/` 下的独立工程，不再打包进后端 JAR（旧版曾把单页 HTML 放在 backend 的 static 目录，缺点是用不了 npm 生态、无法独立发布）。技术栈：

| 依赖 | 作用 |
|------|------|
| Vite | 前端构建工具 + 开发服务器（端口 5173），改代码即时热更新 |
| React | UI 框架，页面由组件拼成，状态变化自动更新 DOM |
| react-router-dom | SPA 路由：地址栏变了但不重新加载页面，由 JS 决定渲染哪个组件 |

### 开发期跨域：Vite 代理

前端跑在 5173，后端在 8080，浏览器直接跨端口请求会触发 CORS。[vite.config.js](../frontend/vite.config.js) 里配了代理：

```javascript
server: {
  proxy: {
    '/api': 'http://localhost:8080',
  },
},
```

浏览器请求 `http://localhost:5173/api/users`，Vite 在服务端把它转发给 8080，对浏览器来说始终是同源请求，CORS 问题根本不会出现。注意这只是**开发期**的便利：生产环境没有 Vite，跨域要靠 Nginx 反代或后端加 CORS 配置。

### 路由表（App.jsx）

[App.jsx](../frontend/src/App.jsx) 定义了三条路由：

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/users" element={<RequireAuth><Users /></RequireAuth>} />
  <Route path="*" element={<Navigate to="/users" replace />} />
</Routes>
```

- `/login`、`/register` 公开；`/users` 被 `<RequireAuth>` 包住，未登录会被守卫拦截。
- `path="*"` 兜底：没匹配上的路径一律送去 `/users`，若没登录，守卫再转去 `/login`。

### 路由守卫（RequireAuth.jsx）

守卫就是一个普通组件：读登录态，决定渲染子组件还是重定向。

```jsx
export default function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
```

两个细节：

- `state={{ from: location.pathname }}` 把用户原本想去的地址塞进路由 state，登录成功后 [Login.jsx](../frontend/src/pages/Login.jsx) 会跳回 `location.state?.from`，而不是一律回首页；
- 前端守卫保护的只是**页面**（不让用户看到注定失败的界面），API 的真正防线仍是后端 JWT——绕过前端直接 curl 后端接口照样会被 403 挡住。

### 登录态管理（AuthContext.jsx）

token 是全局状态（守卫、页面、请求封装都要用），用 React Context 共享：

- `main.jsx` 里 `<AuthProvider>` 包在 `App` 外层，[AuthContext.jsx](../frontend/src/AuthContext.jsx) 把 `token / email / login / logout` 放进 Context；
- `useAuth()` 是自定义 Hook，任何组件一行代码拿到登录态；
- token 初始值直接从 localStorage 读（`useState(() => getToken())`），所以**刷新页面后登录态不丢**；
- `login()` / `logout()` 同时更新 Context 和 localStorage，两边永远一致。

### 统一 API 封装（api.js）

[api.js](../frontend/src/api.js) 用一个 `request()` 函数统一封装 fetch，自动加 Authorization 头：

```javascript
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
```

设计上的取舍：`request()` **不直接登出**，而是抛出带 `status` 的 `ApiError`，由 [Users.jsx](../frontend/src/pages/Users.jsx) 捕获后决定 `logout()` + 跳登录页——api.js 只管 HTTP，导航是页面的事，分层更干净。`data?.message` 直接复用后端 `GlobalExceptionHandler` 返回的 `{status, message, timestamp}` 格式，后端改文案前端无需跟着改。

### token 存在哪里

本项目用 `localStorage` 存 token，刷新页面、新开标签页都保持登录：

```javascript
localStorage.setItem('token', data.token);
```

**安全提示**：`localStorage` 里的内容能被页面上任何 JavaScript 读取，一旦有 XSS 漏洞 token 就会泄漏。生产环境更推荐用 `HttpOnly` Cookie 存放 token，JavaScript 读不到，可以挡住 XSS 窃取。

### 渲染列表时避免 XSS

React 的 JSX 插值会自动转义：`<td>{u.name}</td>` 即使 `u.name` 是 `<img src=x onerror=alert(1)>`，也只会当纯文本渲染，等价于逐个元素 `textContent` 赋值。危险的是 `dangerouslySetInnerHTML`（名字本身就是在警告你），不要用它渲染用户输入。

### 试用流程

1. 终端 1 启动后端：`cd backend && /opt/homebrew/bin/mvn spring-boot:run`
2. 终端 2 启动前端：`cd frontend && npm run dev`
3. 浏览器打开 `http://localhost:5173/`，未登录会被守卫重定向到 `/login`
4. 在注册页创建账号，或直接用登录页预填的 `alice@example.com / 123456` 登录
5. 登录后进入用户列表，可新增、删除用户；Network 面板能看到每个 `/api` 请求都带着 `Authorization: Bearer ...`
6. 在开发者工具里把 localStorage 的 `token` 改成乱码后刷新，页面会提示「登录已过期」并跳回登录页——这就是 401/403 自动登出链路

### 生产构建

```bash
cd frontend
npm run build     # 产物输出到 dist/，纯静态文件
npm run preview   # 本地预览生产构建
```

`dist/` 是纯静态文件，部署时交给 Nginx 托管并把 `/api` 反向代理到后端 8080。注意 SPA 要把所有路径回退到 `index.html`（Nginx 配 `try_files $uri /index.html`），否则直接刷新 `/users` 会 404——因为 `/users` 这个路径只存在于前端路由里，服务器上并没有这个文件。

---


完成本项目后，推荐继续学习：

1. **数据库迁移**：用 Flyway 管理数据库版本，替代 `ddl-auto=update`
2. **参数校验**：添加 `spring-boot-starter-validation`，用 `@NotBlank`、`@Email` 注解校验入参
3. **分页查询**：JPA 的 `Pageable` 接口，给 `GET /api/users` 加分页
4. **日志**：用 SLF4J + Logback 替代 `System.out.println`
5. **监控**：添加 `spring-boot-starter-actuator` 暴露健康检查端点
