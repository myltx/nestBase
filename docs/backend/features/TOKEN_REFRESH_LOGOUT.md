# Token 刷新和退出登录接口文档

## 概述

本文档介绍新增的 Token 刷新和退出登录功能，采用双 Token 机制（Access Token + Refresh Token）提升安全性。

## 🔐 双 Token 机制说明

### Token 类型

| Token 类型 | 有效期 | 用途 | 存储位置建议 |
|-----------|--------|------|-------------|
| **Access Token** | 短期（默认 15 分钟） | API 访问认证 | 内存（不建议 localStorage） |
| **Refresh Token** | 长期（默认 7 天） | 刷新 Access Token | HttpOnly Cookie 或安全存储 |

### 工作流程

```
1. 用户登录 → 获得 accessToken + refreshToken
2. 使用 accessToken 访问 API
3. accessToken 过期 → 使用 refreshToken 获取新的 Token 对
4. 继续使用新的 accessToken 访问 API
5. 用户退出 → 客户端删除所有 Token
```

---

## 📡 API 接口

### 1. 用户登录（已更新）

**接口**: `POST /api/auth/login`

**权限**: 公开接口

**请求体**:
```json
{
  "userName": "admin@example.com",
  "password": "admin123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "admin@example.com",
      "userName": "admin",
      "nickName": "管理员",
      "roles": ["ADMIN", "MODERATOR"]
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": "15m"
    }
  }
}
```

**变化说明**:
- ✅ 新增 `refreshToken` 字段
- ✅ `expiresIn` 现在表示 Access Token 的有效期

---

### 2. 刷新 Access Token（新增）

**接口**: `POST /api/auth/refresh`

**权限**: 公开接口（无需 Access Token）

**请求体**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例（成功）**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "admin@example.com",
      "userName": "admin",
      "nickName": "管理员",
      "roles": ["ADMIN", "MODERATOR"]
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // 新的 Access Token
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // 新的 Refresh Token
      "expiresIn": "15m"
    }
  }
}
```

**响应示例（失败）**:
```json
{
  "success": false,
  "message": "Refresh Token 已过期，请重新登录",
  "code": 1107,
  "statusCode": 401,
  "timestamp": "2025-11-05T15:30:00.000Z"
}
```

**错误码说明**:
- `1107` - Token 已过期
- `1108` - Token 无效
- `1104` - 用户不存在
- `1105` - 账户已被禁用

**使用场景**:
- Access Token 即将过期或已过期时
- 应用启动时检查 Token 是否仍然有效
- 静默刷新（在后台自动刷新，用户无感知）

---

### 3. 退出登录（新增）

**接口**: `POST /api/auth/logout`

**权限**: 需要认证（携带 Access Token）

**请求头**:
```
Authorization: Bearer <accessToken>
```

**请求体**: 无

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "退出登录成功"
  }
}
```

**客户端操作**:
1. 调用退出登录接口
2. 删除本地存储的 accessToken 和 refreshToken
3. 清除用户信息
4. 跳转到登录页

**注意事项**:
- 由于 JWT 是无状态的，退出登录主要依赖客户端删除 Token
- 如需实现 Token 黑名单（真正的服务端失效），需要引入 Redis

---

## 🔧 环境变量配置

在 `.env` 文件中配置：

```bash
# JWT 密钥
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Access Token 有效期（短期）
JWT_ACCESS_EXPIRES_IN=15m

# Refresh Token 有效期（长期）
JWT_REFRESH_EXPIRES_IN=7d
```

**推荐配置**:
- **开发环境**: Access Token = 1h, Refresh Token = 7d
- **生产环境**: Access Token = 15m, Refresh Token = 7d
- **高安全环境**: Access Token = 5m, Refresh Token = 1d

---

## 💻 客户端集成示例

### 1. Axios 拦截器实现自动刷新

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// 请求拦截器：自动添加 Access Token
api.interceptors.request.use(
  config => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器：自动刷新 Token
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // 如果是 401 错误且未重试过
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 使用 Refresh Token 获取新的 Token
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(
          'http://localhost:3000/api/auth/refresh',
          { refreshToken }
        );

        // 保存新的 Token
        localStorage.setItem('accessToken', data.data.token.accessToken);
        localStorage.setItem('refreshToken', data.data.token.refreshToken);

        // 重试原请求
        originalRequest.headers.Authorization = `Bearer ${data.data.token.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh Token 也失效了，跳转到登录页
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 2. 登录处理

```typescript
async function login(userName: string, password: string) {
  try {
    const { data } = await api.post('/auth/login', { userName, password });

    // 保存 Token
    localStorage.setItem('accessToken', data.data.token.accessToken);
    localStorage.setItem('refreshToken', data.data.token.refreshToken);

    // 保存用户信息
    localStorage.setItem('user', JSON.stringify(data.data.user));

    return data.data;
  } catch (error) {
    console.error('登录失败:', error);
    throw error;
  }
}
```

### 3. 退出登录处理

```typescript
async function logout() {
  try {
    // 调用退出接口
    await api.post('/auth/logout');
  } catch (error) {
    console.error('退出登录失败:', error);
  } finally {
    // 无论成功失败，都清除本地数据
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // 跳转到登录页
    window.location.href = '/login';
  }
}
```

### 4. 应用启动时验证 Token

```typescript
async function initializeApp() {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    // 没有 Refresh Token，跳转到登录页
    window.location.href = '/login';
    return;
  }

  try {
    // 尝试刷新 Token
    const { data } = await axios.post(
      'http://localhost:3000/api/auth/refresh',
      { refreshToken }
    );

    // 保存新的 Token
    localStorage.setItem('accessToken', data.data.token.accessToken);
    localStorage.setItem('refreshToken', data.data.token.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    // 继续加载应用
  } catch (error) {
    // Token 失效，清除数据并跳转登录
    localStorage.clear();
    window.location.href = '/login';
  }
}
```

---

## 🔒 安全最佳实践

### 1. Token 存储

**推荐方案**:
- ✅ **Access Token**: 存储在内存（组件状态/Vuex/Redux）
- ✅ **Refresh Token**: 存储在 HttpOnly Cookie（最安全）

**不推荐**:
- ❌ 将 Access Token 存储在 localStorage（易受 XSS 攻击）
- ❌ 将 Refresh Token 暴露给 JavaScript（应由服务器自动处理）

### 2. HTTPS

**生产环境必须使用 HTTPS**，防止 Token 在传输过程中被窃取。

### 3. Token 轮换

每次刷新 Token 时，返回新的 Refresh Token（已实现），防止 Token 重放攻击。

### 4. Refresh Token 限制

- 单用户单设备：每次登录使旧的 Refresh Token 失效
- 多设备支持：在数据库中记录活跃的 Refresh Token
- Token 黑名单：将已退出的 Token 加入黑名单（需要 Redis）

### 5. 用户状态检查

刷新 Token 时会检查用户状态，如果用户被禁用，将拒绝刷新。

---

## 🚀 测试示例

### 使用 cURL 测试

```bash
# 1. 登录获取 Token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userName":"admin@example.com","password":"admin123"}'

# 保存返回的 accessToken 和 refreshToken

# 2. 使用 Access Token 访问 API
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. 刷新 Token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# 4. 退出登录
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📝 常见问题

### Q1: Access Token 过期了怎么办？

A: 使用 Refresh Token 调用 `/api/auth/refresh` 接口获取新的 Token 对。建议在客户端实现自动刷新机制（见上面的 Axios 拦截器示例）。

### Q2: Refresh Token 也过期了怎么办？

A: 需要用户重新登录。Refresh Token 过期通常意味着用户长时间未使用应用。

### Q3: 如何实现"记住我"功能？

A: 延长 Refresh Token 的有效期（如 30 天），并在客户端持久化存储。

### Q4: 如何强制用户下线？

A: 当前实现为无状态 JWT，无法强制下线。如需此功能，需要：
1. 实现 Token 黑名单（使用 Redis）
2. 或者使用数据库记录活跃的 Refresh Token

### Q5: 多设备登录如何处理？

A: 当前实现支持多设备登录。如需限制，可以：
1. 在数据库中只保留最新的 Refresh Token
2. 登录时使旧的 Token 失效

---

## 🎯 后续优化建议

1. **Token 黑名单**: 使用 Redis 实现真正的 Token 失效
2. **设备管理**: 记录用户的登录设备，支持远程下线
3. **审计日志**: 记录所有登录、刷新、退出操作（可集成现有的 AuditModule）
4. **IP 限制**: 限制 Token 只能在固定 IP 使用
5. **指纹验证**: 检测客户端指纹，防止 Token 被盗用
6. **滑动过期**: Access Token 每次使用后自动延长有效期

---

**最后更新**: 2025-11-05
**版本**: v1.6.0
