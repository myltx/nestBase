# 🚀 NestBase - 现代化全栈 Monorepo 框架

<div align="center">

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.x-F69220?logo=pnpm)](https://pnpm.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

基于 **NestJS + Supabase + Prisma** 的企业级全栈应用框架，采用 **Monorepo** 架构，支持前后端协作开发。

[快速开始](#快速开始) • [功能特性](#功能特性) • [Monorepo 架构](#monorepo-架构) • [文档结构](#文档结构) • [API 文档](#api-文档)

</div>

---

## ✨ 功能特性

### 🔐 认证授权

- ✅ JWT Token 认证机制
- ✅ 用户注册、登录、登出
- ✅ 基于角色的访问控制（RBAC）
- ✅ 细粒度权限系统 (v1.4.0 新增)
- ✅ 动态菜单权限控制
- ✅ API 操作级权限控制
- ✅ Passport.js 策略集成

### 📦 数据管理

- ✅ Prisma ORM 数据库访问
- ✅ Supabase PostgreSQL 集成
- ✅ 完整的 CRUD 操作
- ✅ 数据验证与转换（class-validator）

### 📚 API 文档

- ✅ Swagger/OpenAPI 自动生成文档
- ✅ 在线接口测试功能
- ✅ 蓝色主题风格设计
- ✅ JWT 认证支持

### 🏗️ 架构设计

- ✅ 模块化架构设计
- ✅ 统一响应格式
- ✅ 全局异常处理
- ✅ 请求数据验证管道
- ✅ **全局 API 治理标准** (v1.5.0 新增)
- ✅ **仪表盘统计模块** (v1.5.0 新增)

```mermaid
graph TD
    User[用户 / 客户端] -->|HTTP 请求| Guards[守卫 (Auth/Roles)]

    subgraph Application [NestJS 应用]
        Guards -->|通过| Interceptors[拦截器 (Logging/Transform)]
        Interceptors --> Pipes[管道 (Validation)]
        Pipes --> Controller[控制器层]
        Controller --> Service[服务层 (Business Logic)]
    end

    subgraph Infrastructure [基础设施]
        Service -->|Prisma Client| ORM[Prisma ORM]
        ORM -->|TCP Connection| DB[(Supabase / PostgreSQL)]
    end

    style User fill:#f9fafb,stroke:#374151
    style Application fill:#eef2ff,stroke:#4f46e5
    style Infrastructure fill:#f0fdf4,stroke:#16a34a
```

---

## 🛠️ 技术栈

| 技术                | 版本   | 说明                   |
| ------------------- | ------ | ---------------------- |
| **NestJS**          | 10.x   | 渐进式 Node.js 框架    |
| **Prisma ORM**      | 5.x    | 现代化数据库工具包     |
| **Supabase**        | 2.x    | 开源 Firebase 替代方案 |
| **JWT**             | 10.x   | JSON Web Token 认证    |
| **Swagger**         | 7.x    | API 文档生成工具       |
| **TypeScript**      | 5.x    | JavaScript 超集        |
| **class-validator** | 0.14.x | 装饰器验证库           |

---

## 🏗️ Monorepo 架构

本项目采用 **pnpm workspace** 实现 Monorepo 架构，便于前后端协作开发：

```
nestbase/                      # Monorepo 根目录
├── apps/
│   ├── backend/              # NestJS 后端应用
│   │   ├── src/             # 源代码
│   │   ├── prisma/          # 数据库
│   │   └── package.json
│   └── frontend/            # 前端应用（预留）
│       └── README.md        # 前端集成指南
├── packages/                 # 共享包（可选）
├── pnpm-workspace.yaml      # Workspace 配置
└── package.json             # 根配置
```

### 优势

- ✅ **统一依赖管理** - pnpm workspace 共享依赖
- ✅ **前后端协作** - 同一仓库，便于代码复用
- ✅ **类型共享** - 前后端可共享 TypeScript 类型
- ✅ **统一脚本** - 根目录统一管理所有应用

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.x
- **pnpm** >= 8.x（必须使用 pnpm）
- **PostgreSQL** >= 14.x（或使用 Supabase）

### 1. 安装依赖

```bash
# 在根目录安装所有依赖
pnpm install
```

### 2. 配置后端环境变量

```bash
# 进入后端目录
cd apps/backend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填写配置
```

#### 必填配置

##### 选项 1：使用 Supabase（推荐）

如果你的网络是 **IPv4**，需要使用 Supabase 的 **Session Pooler**：

```env
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 数据库配置 - 使用 Session Pooler（端口 6543）用于 IPv4 网络
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# 直连 URL - 用于数据库迁移（也使用 Session Pooler 端口 5432）
DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:5432/postgres"

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

**重要提示**：

- 如果你看到 "Not IPv4 compatible" 提示，必须使用 **Session Pooler**
- 密码中的特殊字符需要 URL 编码（例如 `@` → `%40`）
- 从 Supabase 控制台获取连接字符串：**Settings → Database → Connection string → URI**

##### 选项 2：使用本地 PostgreSQL

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestbase"
JWT_SECRET=your-super-secret-jwt-key
```

### 3. 初始化数据库

```bash
# 在根目录执行（或在 apps/backend 目录执行）

# 生成 Prisma Client
pnpm prisma:generate

# 推送数据库 schema（开发环境推荐）
cd apps/backend
npx prisma db push

# 或运行迁移（生产环境推荐）
pnpm prisma:migrate

# 填充测试数据
pnpm prisma:seed
```

**注意**：

- 首次使用时推荐使用 `npx prisma db push` 快速同步数据库
- 生产环境应使用 `prisma migrate` 进行版本化迁移管理

### 4. 启动后端开发服务器

```bash
# 方式 1: 在根目录启动
pnpm dev

# 方式 2: 进入后端目录启动
cd apps/backend
pnpm dev
```

启动成功后访问：

- **API 服务**: http://localhost:3000
- **Swagger 文档**: http://localhost:3000/api-docs

---

## 📖 API 文档

### 访问 Swagger 文档

启动服务后，访问：**http://localhost:3000/api-docs**

### OpenAPI 文档导出（Apifox/Postman 导入）

本项目支持标准 OpenAPI 3.0 格式导出，可直接导入到 Apifox、Postman 等 API 工具：

**OpenAPI JSON 地址**: http://localhost:3000/api/swagger/json

**使用方法**:

1. 在 Apifox 中选择 "导入" → "URL 导入"
2. 输入上述 URL
3. 点击 "导入" 即可自动导入所有接口

**API 统计信息**: http://localhost:3000/api/swagger/stats

详细导入指南请查看：[APIFOX_IMPORT_GUIDE.md](APIFOX_IMPORT_GUIDE.md)

### 测试账户

数据库种子脚本已创建以下测试账户：

| 角色              | 用户名    | 邮箱                  | 密码         |
| ----------------- | --------- | --------------------- | ------------ |
| **管理员+协调员** | admin     | admin@example.com     | admin123     |
| **普通用户**      | testuser  | user@example.com      | user123      |
| **协调员**        | moderator | moderator@example.com | moderator123 |

**说明**：管理员账户同时拥有 ADMIN 和 MODERATOR 两个角色，展示了多角色功能。

### 主要接口

#### 🔐 认证模块

```http
POST /api/auth/register    # 用户注册
POST /api/auth/login       # 用户登录
GET  /api/auth/profile     # 获取当前用户信息（需认证）
```

#### 📊 仪表盘模块 (v1.5.0 新增)

```http
GET    /api/dashboard/stats # 获取系统概览统计信息
```

#### 👥 用户模块

```http
GET    /api/users          # 查询所有用户（支持分页和搜索）
GET    /api/users/:id      # 根据 ID 查询用户
POST   /api/users          # 创建用户（仅管理员）
PATCH  /api/users/:id      # 更新用户（仅管理员）
DELETE /api/users/:id      # 删除用户（仅管理员）
PUT    /api/users/:id/roles   # 设置用户角色（完全替换，管理员）
GET    /api/users/:id/roles   # 获取用户的角色列表
POST   /api/users/batch-delete # 批量删除用户（管理员，v1.5.0）
```

#### 📁 菜单模块（v1.3.0 新增）

```http
GET    /api/menus                  # 查询所有菜单（仅管理员）
GET    /api/menus/tree             # 获取树形菜单结构（仅管理员）
GET    /api/menus/user-routes      # 获取当前用户的路由菜单
GET    /api/menus/:id              # 根据 ID 查询菜单（仅管理员）
POST   /api/menus                  # 创建菜单（仅管理员）
PATCH  /api/menus/:id              # 更新菜单（仅管理员）
DELETE /api/menus/:id              # 删除菜单（仅管理员）
POST   /api/menus/assign           # 为角色分配菜单（仅管理员）
GET    /api/menus/role/:role       # 获取角色的菜单（仅管理员）
GET    /api/menus/route-names      # 获取所有菜单的路由名称（仅管理员，v1.5.0）
GET    /api/menus/validation/route-name # 验证路由名称是否可用 (v1.5.0)
```

**菜单系统特性**：

- ✅ 支持树形层级结构（父子菜单）
- ✅ 基于角色的菜单权限控制
- ✅ 与前端路由定义完全兼容
- ✅ 支持国际化、图标、排序等丰富配置
- ✅ 动态路由生成

#### 🔐 权限模块（v1.4.0 新增）

```http
GET    /api/permissions                # 查询所有权限（分页）
GET    /api/permissions/by-resource    # 按资源分组查询权限
GET    /api/permissions/:id            # 根据 ID 查询权限
POST   /api/permissions                # 创建权限（仅管理员）
PATCH  /api/permissions/:id            # 更新权限（仅管理员）
DELETE /api/permissions/:id            # 删除权限（仅管理员）
```

#### 👥 角色模块（v1.4.0 扩展）

```http
GET    /api/roles                      # 查询所有角色（支持分页）
GET    /api/roles/:id                  # 查询角色详情
POST   /api/roles                      # 创建角色（仅管理员）
PATCH  /api/roles/:id                  # 更新角色（仅管理员）
DELETE /api/roles/:id                  # 删除角色（仅管理员）
POST   /api/roles/:id/menus            # 为角色分配菜单（仅管理员）
GET    /api/roles/:id/menus            # 获取角色的菜单列表
POST   /api/roles/:id/permissions      # 为角色分配权限（仅管理员）
GET    /api/roles/:id/permissions      # 获取角色的权限列表
GET    /api/roles/:id/users            # 查看该角色下的用户（分页）
POST   /api/roles/:id/users            # 批量添加用户到该角色（管理员）
DELETE /api/roles/:id/users            # 批量将用户从该角色移除（管理员）
POST   /api/roles/batch-delete         # 批量删除角色（管理员，v1.5.0）
```

#### 📄 内容模块 (v1.5.0 更新)

```http
GET    /api/contents                   # 查询内容列表
GET    /api/contents/:id               # 查询内容详情
POST   /api/contents                   # 创建内容
PATCH  /api/contents/:id               # 更新内容
DELETE /api/contents/:id               # 删除内容
POST   /api/contents/batch-delete      # 批量删除内容（管理员，v1.5.0）
```

#### 🏷️ 标签模块 (v1.5.0 新增)

```http
POST   /api/tags                       # 创建标签（仅管理员）
POST   /api/tags/batch                 # 批量创建标签（仅管理员）
GET    /api/tags                       # 查询标签列表
GET    /api/tags/:id                   # 根据 ID 查询标签
GET    /api/tags/slug/:slug            # 根据 slug 查询标签
PATCH  /api/tags/:id                   # 更新标签（仅管理员）
DELETE /api/tags/:id                   # 删除标签（仅管理员）
```

#### 🗂️ 分类模块 (v1.5.0 新增)

```http
POST   /api/categories                 # 创建分类（仅管理员）
GET    /api/categories                 # 查询分类列表（支持 ?format=tree|flat）
GET    /api/categories/:id             # 根据 ID 查询分类
PATCH  /api/categories/:id             # 更新分类（仅管理员）
DELETE /api/categories/:id             # 删除分类（仅管理员）
```

#### 📜 日志模块 (v1.5.0 新增)

```http
GET    /api/logs                       # 查询日志列表（管理员）
GET    /api/logs/stats                 # 获取日志统计（管理员）
```

#### ⚙️ 系统模块 (v1.5.0 新增)

```http
GET    /api/system/status              # 获取系统运行状态
```

### 使用示例

#### 注册新用户

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser",
    "password": "Password123!",
    "firstName": "New",
    "lastName": "User",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=newuser"
  }'
```

**新增字段**：

- `avatar`（可选）：用户头像 URL

#### 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

响应示例：

```json
{
  "code": 0,
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "username": "admin",
      "firstName": "Admin",
      "lastName": "User",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      "roles": ["ADMIN", "MODERATOR"],
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "7d"
    }
  },
  "message": "success",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

**注意**：

- `roles` 现在是数组格式，支持多角色
- `avatar` 字段包含用户头像 URL
- `password` 字段已自动排除

#### 使用 JWT Token 访问受保护接口

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📂 Monorepo 项目结构

```
nestbase/                             # Monorepo 根目录
├── apps/
│   ├── backend/                      # 后端应用
│   │   ├── src/
│   │   │   ├── common/              # 公共模块
│   │   │   │   ├── decorators/     # 装饰器
│   │   │   │   ├── guards/         # 守卫
│   │   │   │   ├── interceptors/   # 拦截器
│   │   │   │   └── filters/        # 过滤器
│   │   │   ├── modules/            # 功能模块
│   │   │   │   ├── prisma/        # 数据库模块
│   │   │   │   ├── auth/          # 认证模块
│   │   │   │   └── users/         # 用户模块
│   │   │   ├── config/            # 配置
│   │   │   ├── app.module.ts      # 主模块
│   │   │   └── main.ts            # 入口
│   │   ├── prisma/                 # Prisma 配置
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   └── frontend/                    # 前端应用（预留）
│       ├── README.md               # 前端集成指南
│       └── package.json
│
├── packages/                        # 共享包（可选）
│   └── shared-types/               # 前后端共享类型
│
├── pnpm-workspace.yaml             # pnpm workspace 配置
├── package.json                    # 根 package.json
├── README.md                       # 主文档
└── .gitignore                      # Git 配置
```

---

## 🔧 Monorepo 脚本命令

### 在根目录执行

```bash
# 开发
pnpm dev                    # 启动后端开发服务器
pnpm dev:backend            # 同上

# 构建
pnpm build                  # 构建后端
pnpm build:backend          # 同上

# 启动
pnpm start                  # 启动后端生产服务器
pnpm start:prod             # 同上

# 数据库
pnpm prisma:generate        # 生成 Prisma Client
pnpm prisma:migrate         # 运行数据库迁移
pnpm prisma:studio          # 打开 Prisma Studio
pnpm prisma:seed            # 运行种子脚本

# 代码质量
pnpm lint                   # 检查所有应用
pnpm format                 # 格式化所有代码
pnpm test                   # 运行所有测试

# 清理
pnpm clean                  # 清理所有 node_modules 和 dist
pnpm clean:all              # 深度清理（包括根 node_modules）
```

### 在应用目录执行

```bash
# 进入后端应用
cd apps/backend

# 运行后端特定命令
pnpm dev                    # 开发模式
pnpm build                  # 构建
pnpm test                   # 测试
```

---

## 🗄️ 数据库模型

### User 用户模型

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  username  String   @unique
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  avatar    String?  // 用户头像 URL
  roles     Role[]   @default([USER]) // 用户角色数组，支持多角色
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

**重要更新（v1.2.0）**：

- ✅ **多角色支持**：用户现在可以拥有多个角色（`roles` 数组）
- ✅ **用户头像**：新增 `avatar` 字段用于存储用户头像 URL
- ✅ **密码保护**：所有 API 响应自动排除 `password` 字段

---

## 🔒 认证与授权

### JWT 认证流程

1. 用户通过 `/api/auth/login` 登录，获取 JWT Token
2. 客户端在后续请求的 `Authorization` 头中携带 Token：

   ```
   Authorization: Bearer <token>
   ```

   **前端示例**:

   ```javascript
   // 使用 axios
   axios.get('/api/auth/profile', {
     headers: {
       Authorization: `Bearer ${token}`,
     },
   });

   // 使用 fetch
   fetch('/api/auth/profile', {
     headers: {
       Authorization: `Bearer ${token}`,
     },
   });
   ```

3. 服务器通过 `JwtAuthGuard` 验证 Token 有效性
4. 通过验证后，用户信息存储在 `request.user` 中

### 用户注册限制

**重要**: 注册接口仅允许创建普通用户（USER 角色），无法通过注册接口创建管理员账户。

- ✅ 普通用户可以通过 `/api/auth/register` 注册
- ❌ 无法注册管理员（ADMIN）或协调员（MODERATOR）角色
- 🔐 管理员账户只能通过数据库种子脚本或管理员手动创建

**管理员账户创建方式**:

1. 运行数据库种子脚本：`pnpm prisma:seed`
2. 通过 Prisma Studio 手动创建：`pnpm prisma:studio`
3. 由现有管理员通过后台管理接口创建

### 角色权限控制

使用 `@Roles()` 装饰器限制接口访问：

```typescript
@Roles(Role.ADMIN)
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

**多角色支持**（v1.2.0 新增）：

- 用户可以同时拥有多个角色（例如：`[ADMIN, MODERATOR]`）
- `@Roles()` 装饰器支持"OR"逻辑：用户只需拥有任一所需角色即可访问
- 示例：`@Roles(Role.ADMIN, Role.MODERATOR)` - 拥有 ADMIN 或 MODERATOR 任一角色即可访问

### 公共路由

使用 `@Public()` 装饰器标记不需要认证的路由：

```typescript
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### 细粒度权限控制（v1.4.0 新增）

#### 权限系统架构

本项目实现了完整的 RBAC 权限系统，支持从菜单级别到 API 操作级别的细粒度权限控制：

```
用户 → 角色 → 权限 → 资源.操作
```

#### 权限格式

权限采用 `resource.action` 格式：

- `resource`: 资源名称（如 user, role, menu, permission, project）
- `action`: 操作类型（如 create, read, update, delete）

**系统内置权限示例**：

- `user.create` - 创建用户
- `user.read` - 查看用户
- `user.update` - 更新用户
- `user.delete` - 删除用户
- `role.manage` - 管理角色
- `menu.read` - 查看菜单

#### 使用权限守卫

使用 `@RequirePermissions()` 装饰器进行细粒度权限控制：

```typescript
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@Controller('users')
export class UsersController {
  // 需要 user.create 权限
  @RequirePermissions('user.create')
  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // 需要 user.read 权限
  @RequirePermissions('user.read')
  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  // 需要 user.update 和 user.read 两个权限
  @RequirePermissions('user.update', 'user.read')
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
```

#### 权限检查流程

1. 用户登录获取 JWT Token
2. 请求携带 Token 访问受保护的 API
3. `JwtAuthGuard` 验证 Token 并提取用户信息
4. `PermissionsGuard` 检查用户角色是否拥有所需权限
5. 权限验证通过，执行业务逻辑

#### 为角色分配权限

```bash
# 为角色分配权限
curl -X POST http://localhost:3000/api/roles/{roleId}/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": ["perm-uuid-1", "perm-uuid-2"]
  }'
```

#### 查询角色权限

```bash
# 获取角色的所有权限
curl -X GET http://localhost:3000/api/roles/{roleId}/permissions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 权限与角色的区别

| 特性     | 角色（Role）           | 权限（Permission）       |
| -------- | ---------------------- | ------------------------ |
| 粒度     | 粗粒度                 | 细粒度                   |
| 用途     | 菜单访问控制           | API 操作控制             |
| 示例     | ADMIN, USER            | user.create, user.delete |
| 检查方式 | `@Roles()`             | `@RequirePermissions()`  |
| 最佳实践 | 用于前端路由和菜单显示 | 用于后端 API 权限验证    |

**推荐实践**：

- ✅ 使用角色控制菜单和页面访问（前端）
- ✅ 使用权限控制具体操作权限（后端 API）
- ✅ 一个用户可以有多个角色
- ✅ 一个角色可以有多个权限

---

## ⚖️ API 治理标准 (v1.5.0)

本项目遵循严格的 RESTful API 设计规范与治理标准，确保接口的一致性与可维护性。

### 核心原则

1.  **资源导向设计**：API URL 基于名词资源（如 `/users`, `/roles`），避免动词（如 `/getUsers`）。
2.  **标准 HTTP 方法**：
    - `GET`: 查询资源
    - `POST`: 创建资源
    - `PATCH`: 部分更新资源
    - `DELETE`: 删除资源
3.  **统一批量操作**：
    - 批量删除接口统一为 `POST /:resource/batch-delete`。
    - 请求体统一格式：`{ ids: ["id1", "id2"] }`。
4.  **轻量级 Controller**：Controller 仅负责参数校验与权限控制，业务逻辑全部下沉至 Service 层。

### 目录结构优化

v1.5.0 对后端模块进行了重构与标准化：

- **移除中间模块**：废弃 `user-roles` 模块，相关功能拆分归位至 `users`（用户视角）和 `roles`（角色视角）。
- **新增 Dashboard**：使用 `dashboard` 模块替代原有的 `home` 模块，提供专门的系统统计服务。
- **模块独立性**：增强了 Users 和 Auth 模块的边界清晰度。

---

## 🔧 Supabase 配置指南

### 获取 Supabase 连接信息

1. **登录 Supabase 控制台**：https://supabase.com/dashboard

2. **选择或创建项目**

3. **获取数据库连接字符串**：
   - 进入 **Settings** → **Database**
   - 找到 **Connection string** 区域
   - 如果看到 "Not IPv4 compatible"，选择 **Use connection pooling**
   - 选择 **Transaction mode** 或 **Session mode**
   - 复制 URI 格式的连接字符串

4. **获取 API 密钥**：
   - 进入 **Settings** → **API**
   - 复制 **Project URL**、**anon/public key** 和 **service_role key**

### IPv4 网络配置（重要）

如果你的 Supabase 项目显示 **"Not IPv4 compatible"**，你必须使用连接池：

```env
# Transaction mode (端口 6543) - 推荐用于 Prisma
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session mode (端口 5432) - 用于迁移
DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:5432/postgres"
```

### 密码 URL 编码

如果你的数据库密码包含特殊字符，需要进行 URL 编码：

| 字符 | URL 编码 |
| ---- | -------- |
| `@`  | `%40`    |
| `#`  | `%23`    |
| `$`  | `%24`    |
| `%`  | `%25`    |
| `&`  | `%26`    |
| `+`  | `%2B`    |
| `/`  | `%2F`    |
| `:`  | `%3A`    |
| `=`  | `%3D`    |
| `?`  | `%3F`    |

**示例**：

```
原密码：my@pass#word
编码后：my%40pass%23word
```

### 常见问题

#### 1. 数据库连接超时

**错误**：`Can't reach database server`

**解决方案**：

- 检查是否使用了正确的连接池端口
- 确认网络可以访问 Supabase
- 使用 Session Pooler 而不是直连

#### 2. 认证失败

**错误**：`Authentication failed against database server`

**解决方案**：

- 确认密码是否正确
- 检查特殊字符是否已 URL 编码
- 从 Supabase 控制台重新获取连接字符串

#### 3. Prisma Schema 配置

确保你的 `prisma/schema.prisma` 包含 `directUrl`：

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 用于迁移
}
```

---

## 🌍 环境变量说明

| 变量名                      | 说明                               | 默认值      | 必填   |
| --------------------------- | ---------------------------------- | ----------- | ------ |
| `NODE_ENV`                  | 运行环境                           | development | 否     |
| `PORT`                      | 服务端口                           | 3000        | 否     |
| `API_PREFIX`                | API 路径前缀                       | api         | 否     |
| `DATABASE_URL`              | 数据库连接字符串（用于应用运行时） | -           | **是** |
| `DIRECT_URL`                | 直连数据库字符串（用于迁移）       | -           | **是** |
| `SUPABASE_URL`              | Supabase 项目 URL                  | -           | 是     |
| `SUPABASE_ANON_KEY`         | Supabase 匿名密钥                  | -           | 是     |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务密钥                  | -           | 否     |
| `JWT_SECRET`                | JWT 签名密钥                       | -           | **是** |
| `JWT_EXPIRES_IN`            | JWT 过期时间                       | 7d          | 否     |
| `SWAGGER_PATH`              | Swagger 文档路径                   | api-docs    | 否     |

**重要配置说明**：

1. **DATABASE_URL vs DIRECT_URL**
   - `DATABASE_URL`：应用运行时使用，建议使用连接池（端口 6543）
   - `DIRECT_URL`：数据库迁移使用，使用 Session mode（端口 5432）

2. **IPv4 网络**
   - 如果使用 IPv4 网络，两个 URL 都必须使用 Supabase Pooler
   - 不要使用直连地址（`db.xxx.supabase.co`）

3. **JWT_SECRET**
   - 生产环境必须使用强随机密钥
   - 建议至少 32 个字符
   - 可使用命令生成：`openssl rand -base64 32`

---

## 📝 开发指南

### API 命名规范

本项目采用统一的 **camelCase（小驼峰）** 命名规范，确保前后端数据交互的一致性。

📖 **详细设计文档**：[API_NAMING_CONVENTION.md](apps/backend/API_NAMING_CONVENTION.md)

#### 快速概览

#### 命名转换流程

```
前端 (camelCase) → 后端 API (camelCase) → 数据库 (snake_case)
   ↑                                              ↓
   └──────────────── Prisma 自动转换 ──────────────┘
```

#### 实现方式

1. **Prisma Schema 使用 `@map()` 映射**：

   ```prisma
   model User {
     firstName String?  @map("first_name")  // API: firstName, DB: first_name
     lastName  String?  @map("last_name")   // API: lastName,  DB: last_name
     createdAt DateTime @map("created_at")  // API: createdAt, DB: created_at
     @@map("users")                         // 表名映射
   }
   ```

2. **DTO 使用 camelCase**：

   ```typescript
   export class CreateUserDto {
     firstName?: string; // 前端发送: firstName
     lastName?: string; // 后端接收: firstName
   }
   ```

3. **API 响应自动使用 camelCase**：
   ```json
   {
     "id": "uuid",
     "firstName": "John", // ✅ camelCase
     "lastName": "Doe", // ✅ camelCase
     "createdAt": "2025-01-15" // ✅ camelCase
   }
   ```

#### 为什么这样设计？

✅ **优势**：

- **前端友好**：JavaScript/TypeScript 标准命名，无需转换
- **数据库规范**：PostgreSQL 保持 snake_case 传统
- **零性能开销**：Prisma 在编译时生成转换代码，无运行时开销
- **类型安全**：TypeScript 类型定义完全匹配
- **维护简单**：只需在 Prisma schema 中配置一次 `@map()`

❌ **不推荐的方案**：

- ~~添加全局拦截器转换字段名~~（性能损耗，复杂度高）
- ~~前端手动转换~~（代码重复，容易出错）
- ~~API 使用 snake_case~~（不符合 JavaScript 规范）

#### 添加新字段示例

```prisma
// 1. 在 Prisma Schema 中添加字段
model User {
  phoneNumber String? @map("phone_number")  // 使用 @map() 映射
}

// 2. 生成 Prisma Client
// pnpm prisma:generate

// 3. 在 DTO 中使用 camelCase
export class CreateUserDto {
  phoneNumber?: string;  // ✅ 自动映射到数据库的 phone_number
}

// 4. API 响应自动使用 camelCase
{
  "phoneNumber": "13800138000"  // ✅ 前端直接使用
}
```

### 添加新模块

1. 使用 NestJS CLI 生成模块：

   ```bash
   nest g module modules/your-module
   nest g controller modules/your-module
   nest g service modules/your-module
   ```

2. 在 `app.module.ts` 中导入新模块

3. 添加 Swagger 文档标签：
   ```typescript
   @ApiTags('模块名称')
   @Controller('your-module')
   export class YourModuleController {}
   ```

### 数据验证

使用 `class-validator` 装饰器进行验证：

```typescript
import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '邮箱' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '密码' })
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;
}
```

### 统一响应格式

所有 API 响应自动使用以下格式：

#### 成功响应

```typescript
{
  code: number,         // 业务状态码（0 表示成功）
  success: boolean,     // 请求是否成功
  data: any,           // 响应数据
  message: string,     // 响应消息
  timestamp: string    // 时间戳
}
```

**示例**:

```json
{
  "code": 0,
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "username": "admin",
      "role": "ADMIN"
    },
    "token": {
      "accessToken": "eyJhbGc...",
      "expiresIn": "7d"
    }
  },
  "message": "success",
  "timestamp": "2025-10-16T08:00:00.000Z"
}
```

#### 错误响应

```typescript
{
  code: number,         // 业务状态码（非 0 表示错误）
  success: false,       // 请求失败
  statusCode: number,   // HTTP 状态码
  message: string,      // 错误消息
  errors: any,          // 详细错误信息
  timestamp: string,    // 时间戳
  path: string          // 请求路径
}
```

**示例**:

```json
{
  "code": 1106,
  "success": false,
  "statusCode": 409,
  "message": "邮箱已被注册",
  "errors": null,
  "timestamp": "2025-10-16T08:00:00.000Z",
  "path": "/api/auth/register"
}
```

#### 业务状态码

本项目使用业务状态码来标识具体的业务错误，详细状态码列表请查看：

- [BUSINESS_CODES.md](apps/backend/BUSINESS_CODES.md) - 完整状态码列表和使用说明
- [BUSINESS_CODES_IMPLEMENTATION.md](apps/backend/BUSINESS_CODES_IMPLEMENTATION.md) - 所有模块实现详情

常用状态码：

- `0`: 操作成功
- `1101`: 用户名或密码错误
- `1104`: 用户不存在
- `1106`: 邮箱已被注册
- `1107`: 用户名已被使用
- `1108`: 无法注册管理员账户
- `1201`: 资源不存在

**模块覆盖情况**:

- ✅ **AuthService**: 7 处异常处理
- ✅ **UsersService**: 6 处异常处理
- ✅ **ProjectsService**: 4 处异常处理
- ✅ **全局拦截器**: 统一响应格式

---

## 📚 文档结构

本项目采用统一的文档管理体系，所有文档按服务分类整理在 `docs/` 目录下。

### 文档目录结构

```
docs/
├── README.md              # 📚 文档中心导航
├── backend/               # 🔧 Backend 后端服务文档（29个）
│   ├── architecture/     # 架构设计（API规范、业务状态码）
│   ├── features/         # 功能发布（日志、CMS、Token）
│   ├── guides/           # 使用指南（API、菜单、角色）
│   ├── migrations/       # 数据库迁移
│   └── api/              # API 参考
├── frontend/              # 🎨 Frontend 前端服务文档（预留）
└── project/               # 📦 项目级文档（19个）
    ├── setup/            # 项目设置（快速开始、环境配置）
    ├── development/      # 开发维护（变更日志、代码检查）
    ├── features/         # 功能实现（RBAC、角色迁移）
    ├── api-tools/        # API 工具（Apifox、OpenAPI）
    └── project-management/ # 项目管理（交付报告）
```

### 快速入口

| 文档类型             | 说明                 | 入口                                               | 数量  |
| -------------------- | -------------------- | -------------------------------------------------- | ----- |
| 🔧 **Backend 文档**  | NestJS 后端技术文档  | [docs/backend/README.md](docs/backend/README.md)   | 29 个 |
| 📦 **Project 文档**  | 项目配置和管理文档   | [docs/project/README.md](docs/project/README.md)   | 19 个 |
| 🎨 **Frontend 文档** | 前端服务文档（预留） | [docs/frontend/README.md](docs/frontend/README.md) | -     |
| 📚 **文档中心**      | 完整文档导航和索引   | [docs/README.md](docs/README.md)                   | -     |

### 按角色快速导航

| 角色           | 推荐阅读路径                                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **新开发人员** | [快速开始](docs/project/setup/QUICKSTART.md) → [Supabase配置](docs/project/setup/SUPABASE_SETUP.md) → [RBAC权限](docs/project/features/RBAC_GUIDE.md)                       |
| **后端开发**   | [API规范](docs/backend/architecture/API_NAMING_CONVENTION.md) → [业务状态码](docs/backend/architecture/BUSINESS_CODES.md) → [CMS指南](docs/backend/guides/CMS_API_GUIDE.md) |
| **前端开发**   | [Apifox导入](docs/project/api-tools/APIFOX_IMPORT_GUIDE.md) → [CMS API](docs/backend/guides/CMS_API_GUIDE.md) → [用户角色API](docs/backend/guides/API_USER_ROLES.md)        |
| **架构师**     | [Monorepo架构](docs/project/setup/MONOREPO.md) → [RBAC设计](docs/project/features/RBAC_REDESIGN.md) → [Backend架构](docs/backend/architecture/)                             |
| **运维人员**   | [Supabase配置](docs/project/setup/SUPABASE_SETUP.md) → [数据库迁移](docs/backend/migrations/MIGRATION_GUIDE.md)                                                             |

---

## 🚀 部署指南

### 构建生产版本

```bash
pnpm build
```

### 运行生产服务器

```bash
pnpm start:prod
```

### 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name nestbase

# 查看日志
pm2 logs nestbase

# 重启应用
pm2 restart nestbase
```

### Docker 部署

创建 `Dockerfile`：

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

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

## 💬 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 Email: 865147643@qq.com
- 🐛 Issues: [GitHub Issues](https://github.com/myltx/nestBase/issues)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给个 Star！**

Made with ❤️ by [myltx]

</div>
