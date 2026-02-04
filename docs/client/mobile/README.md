# NestBase Mobile 文档

> 📚 **文档版本**: v1.0.0
> 📅 **最后更新**: 2026-02-04
> 📱 **项目**: NestBase Mobile (based on unibest)

---

## 📂 文档目录结构

```
docs/client/mobile/
├── README.md               # 文档索引（本文件）
├── features/               # 移动端功能文档
└── guides/                 # 开发指南
```

## 🏗️ 架构概览

NestBase Mobile 是基于 [unibest](https://github.com/feige996/unibest) 模板构建的 UniApp 项目，深度集成了 NestBase 后端接口。

### 技术栈

- **框架**: UniApp + Vue 3
- **构建工具**: Vite 5
- **UI 库**: Wot Design Uni
- **CSS**: UnoCSS
- **语言**: TypeScript

### 核心集成

| 功能     | 说明                             | 对应后端模块         |
| -------- | -------------------------------- | -------------------- |
| **认证** | 双 Token 机制 (Access + Refresh) | `AuthModule`         |
| **请求** | 统一请求封装 + 拦截器            | `GlobalInterceptor`  |
| **代理** | H5 开发环境反向代理              | `Nginx / Vite Proxy` |

---

## 🚀 快速开始

### 1. 环境配置

复制配置文件：

```bash
cp apps/mobile/env/.env.example apps/mobile/env/.env
```

配置 `apps/mobile/env/.env`:

```bash
# 后端 API 地址
VITE_SERVER_BASEURL = 'http://localhost:9423/api'

# 认证模式 (必须为 double)
VITE_AUTH_MODE = 'double'
```

### 2. 启动开发服务

```bash
pnpm dev:mobile
```

- **H5**: <http://localhost:9000>
- **微信小程序**: 打开微信开发者工具导入 `apps/mobile/dist/dev/mp-weixin`

---

## 🔐 认证流程

移动端使用与 Web 端一致的双 Token 认证流程：

1. **登录**: 调用 `POST /auth/login`，获取 `accessToken` 和 `refreshToken`。
2. **请求**: 请求头携带 `Authorization: Bearer <accessToken>`。
3. **刷新**: 拦截 401 响应，使用 `refreshToken` 调用刷新接口，重试请求。
4. **用户**: 调用 `GET /auth/profile` 获取当前用户信息。

---

## 📝 常见问题

### H5 跨域问题

开发环境下，`vite.config.ts` 已配置代理：

```typescript
// apps/mobile/vite.config.ts
proxy: {
  '/api': {
    target: env.VITE_SERVER_BASEURL,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}
```

确保 `.env` 中的 `VITE_APP_PROXY_ENABLE = true`。

### 真机调试

真机调试时无法使用 `localhost`，请将 `VITE_SERVER_BASEURL` 修改为局域网 IP（如 `http://192.168.1.x:9423/api`）。
