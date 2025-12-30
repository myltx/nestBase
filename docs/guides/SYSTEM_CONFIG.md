# 系统配置详解 (Environment Variables)

本文档详细列出了 NestBase 项目中所有可用的环境变量配置项。

## 1. 后端配置 (`apps/backend/.env`)

| 变量名                     | 是否必填 | 默认值        | 说明                               |
| :------------------------- | :------- | :------------ | :--------------------------------- |
| **基础配置**               |
| `PORT`                     | 否       | `3000`        | 服务监听端口                       |
| `NODE_ENV`                 | 否       | `development` | 环境模式: development / production |
| `API_PREFIX`               | 否       | `api`         | 全局路由前缀                       |
| **数据库 (Prisma)**        |
| `DATABASE_URL`             | **是**   | -             | PostgreSQL 连接字符串 (支持连接池) |
| `DIRECT_URL`               | **是**   | -             | PostgreSQL 直连字符串 (用于迁移)   |
| **认证安全**               |
| `JWT_SECRET`               | **是**   | -             | JWT 签名密钥，**务必保密**         |
| `JWT_EXPIRES_IN`           | 否       | `7d`          | Token 有效期                       |
| `REFRESH_TOKEN_EXPIRES_IN` | 否       | `30d`         | 刷新 Token 有效期                  |
| **Redis (可选)**           |
| `REDIS_HOST`               | 否       | `localhost`   | Redis 地址                         |
| `REDIS_PORT`               | 否       | `6379`        | Redis 端口                         |
| `REDIS_PASSWORD`           | 否       | -             | Redis 密码                         |
| **Swagger**                |
| `SWAGGER_ENABLE`           | 否       | `true`        | 是否启用 Swagger 文档              |
| `SWAGGER_PATH`             | 否       | `api-docs`    | 文档访问路径                       |

## 2. 前端配置 (`apps/frontend/.env`)

注意：前端环境变量必须以 `VITE_` 开头。

| 变量名                     | 说明                   | 示例                                        |
| :------------------------- | :--------------------- | :------------------------------------------ |
| **构建与服务**             |
| `VITE_SERVICE_BASE_URL`    | 后端 API 地址          | `http://localhost:3000`                     |
| `VITE_HTTP_PROXY`          | 是否开启开发代理       | `Y` 或 `N`                                  |
| **路由**                   |
| `VITE_ROUTER_HISTORY_MODE` | 路由模式               | `history` (推荐) 或 `hash`                  |
| `VITE_ROUTE_HOME_PATH`     | 登录后默认跳转页       | `/home`                                     |
| **功能开关**               |
| `VITE_AUTH_ROUTE_MODE`     | 路由权限模式           | `dynamic` (后端动态) 或 `static` (前端静态) |
| `VITE_Visualizer`          | 是否在构建时生成包分析 | `Y` 或 `N`                                  |

## 3. 特殊配置说明

### 3.1 跨域配置 (CORS)

后端默认允许所有跨域 (`origin: *`)。在生产环境中，建议修改 `main.ts` 中的 `cors` 配置，或通过环境变量注入允许的域名列表。

### 3.2 数据库连接模式 (Supabase 特有)

如果你使用 Supabase，`schema.prisma` 分离了两个 URL：

- `DATABASE_URL`: 用于应用运行时，应连接到 Transaction Pooler (端口 6543)。
- `DIRECT_URL`: 用于 `prisma migrate`，应直接连接到数据库 Session (端口 5432)。

确保在 `.env` 中正确区分这两个地址。
