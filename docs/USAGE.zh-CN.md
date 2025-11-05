# NestBase 使用说明

本指南面向首次接入与日常运维的同学，涵盖环境准备、安装配置、数据库初始化、开发启动、接口文档、权限使用、部署与故障排查等内容。

## 简介

- 技术栈：NestJS 10、TypeScript 5、Prisma 5、PostgreSQL（Supabase 集成）、JWT、Swagger、class-validator。
- 架构：pnpm workspace Monorepo，后端位于 `apps/backend`，内置统一响应格式、全局异常处理、RBAC + 细粒度权限、菜单系统、OpenAPI 导出。

## 环境准备

- Node.js ≥ 18
- pnpm ≥ 8（必须）
- PostgreSQL ≥ 14（或 Supabase 项目）
- OpenSSL（建议，用于生成强随机 JWT 密钥）

## 安装依赖

```bash
# 根目录
pnpm install
```

## 配置环境变量

进入后端目录并复制环境模板：

```bash
cd apps/backend
cp .env.example .env
```

按实际情况选择其一进行配置：

### 方案 A：Supabase（推荐，IPv4 使用连接池 Pooler）

```env
NODE_ENV=development
PORT=3000
API_PREFIX=api

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 运行时使用连接池（6543）
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 迁移直连（5432）
DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:5432/postgres"

JWT_SECRET=请使用强随机字符串
JWT_EXPIRES_IN=7d
```

提示：密码含特殊字符需 URL 编码（如 `@` → `%40`）。如控制台提示 “Not IPv4 compatible”，必须使用 Pooler。

### 方案 B：本地 PostgreSQL

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestbase"
JWT_SECRET=请使用强随机字符串
```

生成强随机密钥：

```bash
openssl rand -base64 32
```

## 初始化数据库

```bash
# 根目录生成 Prisma Client
pnpm prisma:generate

# 同步 schema（开发快速上手）
cd apps/backend
npx prisma db push

# 或标准迁移（团队/生产）
pnpm prisma:migrate

# 种子数据
pnpm prisma:seed

# 可视化管理（可选）
pnpm prisma:studio
```

## 启动开发服务器

```bash
# 方式 1：根目录
pnpm dev

# 方式 2：后端目录
cd apps/backend && pnpm dev
```

访问：

- API 服务：`http://localhost:3000`
- Swagger 文档：`http://localhost:3000/api-docs`
- OpenAPI JSON：`http://localhost:3000/api/swagger/json`
- API 统计：`http://localhost:3000/api/swagger/stats`

Apifox/Postman 导入参见：`APIFOX_IMPORT_GUIDE.md`

## 测试账号

- 管理员+协调员：`admin / admin123`
- 普通用户：`testuser / user123`
- 协调员：`moderator / moderator123`

## 认证与权限快速指南

- 登录：`POST /api/auth/login`，响应返回 `accessToken`。
- 鉴权：后续请求在 Header 附带 `Authorization: Bearer <token>`。
- 当前用户：`GET /api/auth/profile`。
- 角色限制：`@Roles(Role.ADMIN, Role.MODERATOR)`（OR 逻辑）。
- 精细权限：`@RequirePermissions('resource.action')`，如 `user.create`、`user.read`。
- 公共路由：`@Public()` 标注无需认证的接口。

为角色分配权限（示例）：

```http
POST /api/roles/{roleId}/permissions
{
  "permissionIds": ["perm-uuid-1", "perm-uuid-2"]
}
```

角色与用户关联（示例）：

- 查看角色用户：`GET /api/roles/{id}/users`
- 批量添加：`POST /api/roles/{id}/users`（传用户 ID 列表）
- 批量移除：`DELETE /api/roles/{id}/users`

## 主要接口速查

- 认证：`/api/auth/register`、`/api/auth/login`、`/api/auth/profile`
- 用户：`/api/users` 增删改查、`/api/users/:id/roles` 设置/获取用户角色
- 菜单：`/api/menus`、`/api/menus/tree`、`/api/menus/user-routes`
- 权限：`/api/permissions` 增删改查、`/api/permissions/by-resource`
- 角色：`/api/roles`、`/api/roles/:id/{menus|permissions|users}`

## 常用脚本（根目录）

```bash
# 开发/构建/启动
pnpm dev | pnpm dev:backend
pnpm build | pnpm build:backend
pnpm start | pnpm start:prod

# Prisma
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm prisma:studio

# 质量
pnpm lint
pnpm format
pnpm test

# 清理
pnpm clean
pnpm clean:all
```

## 部署

### PM2

```bash
pnpm build
npm i -g pm2
pm2 start dist/main.js --name nestbase
pm2 logs nestbase
pm2 restart nestbase
```

### Docker（推荐在 CI 先构建 dist）

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/main"]
```

## 故障排查

- 数据库连接超时：优先用 Supabase Pooler（6543），确认网络可达。
- 认证失败：核对密码并进行 URL 编码（如 `@`→`%40`）。
- Prisma 迁移：`schema.prisma` 确保含 `directUrl = env("DIRECT_URL")`。
- JWT 无效：检查 `Authorization` 头、`JWT_SECRET`、服务器时间漂移。

## 安全与最佳实践

- 生产必须使用强随机 `JWT_SECRET`，并考虑限制 `/api-docs` 访问。
- 登录与敏感接口建议限流（`@nestjs/throttler`）。
- 全局开启 `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`。
- 守卫区分 401/403；公共路由使用 `@Public()`。
- DTO 全量校验；路径参数使用 `ParseUUIDPipe`/`ParseIntPipe`。
- 避免在守卫内频繁 DB 查询，缓存用户权限集合（TTL）。

## 目录结构速览

```
nestbase/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── common/ (decorators/guards/interceptors/filters)
│   │   │   ├── modules/ (prisma/auth/users/...)
│   │   │   ├── config/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── prisma/ (schema.prisma, seed.ts)
│   │   └── .env.example
└── packages/ ...
```

## 版本要点

- v1.2.0：用户多角色支持（`roles: Role[]`）、头像字段、密码自动排除。
- v1.3.0：菜单模块，树形结构与按角色授权。
- v1.4.0：细粒度权限系统（`resource.action`）、角色/权限管理与分配接口完善。

