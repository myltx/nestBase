# 快速启动指南（Monorepo 版本）

本文件提供 Monorepo 架构下的快速启动步骤。

## 🚀 快速启动（4 步完成）

### 步骤 1：安装所有依赖

```bash
# 在根目录执行（pnpm workspace 会自动安装所有应用的依赖）
pnpm install
```

### 步骤 2：配置后端环境变量

```bash
# 进入后端目录
cd apps/backend

# 复制环境变量模板
cp .env.example .env
```

编辑 `apps/backend/.env` 文件，**必填配置项**：

**使用 Supabase（推荐）：**
```env
# 从 Supabase 控制台获取：Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-x-region.pooler.supabase.com:5432/postgres"

# 从 Supabase 控制台获取：Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 生成强密钥：openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**或使用本地 PostgreSQL：**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestbase"
JWT_SECRET=your-super-secret-jwt-key
```

**⚠️ 重要提示**：
- IPv4 网络必须使用 Supabase Session Pooler
- 密码中的 `@` 需要编码为 `%40`

### 步骤 3：初始化数据库

```bash
# 返回根目录
cd ../..

# 生成 Prisma Client
pnpm prisma:generate

# 推送数据库 schema（开发环境推荐）
cd apps/backend
npx prisma db push

# 填充测试数据（可选）
cd ../..
pnpm prisma:seed
```

**💡 提示**：
- `prisma db push` 适合开发环境快速同步
- 生产环境应使用 `pnpm prisma:migrate` 进行版本化迁移

### 步骤 4：启动开发服务器

```bash
# 在根目录启动后端
pnpm dev
```

## ✅ 验证安装

访问以下 URL 确认服务正常运行：

- **API 服务**: http://localhost:3000/api
- **Swagger 文档**: http://localhost:3000/api-docs

## 🔑 测试账户

数据库种子脚本创建了以下测试账户：

- **管理员**: admin@example.com / admin123
- **普通用户**: user@example.com / user123

## 📁 Monorepo 结构

```
nestbase/
├── apps/
│   ├── backend/       # NestJS 后端（已完成）
│   └── frontend/      # 前端应用（预留）
├── pnpm-workspace.yaml
└── package.json       # 根配置
```

## 🎯 常用命令

```bash
# 在根目录执行
pnpm dev               # 启动后端开发服务器
pnpm build             # 构建后端
pnpm prisma:studio     # 打开数据库可视化工具

# 或进入应用目录
cd apps/backend
pnpm dev               # 启动后端
```

## 🌟 添加前端应用

查看 `apps/frontend/README.md` 了解如何集成前端框架（React、Vue、Next.js 等）。

## 📚 下一步

查看 [README.md](README.md) 了解完整的使用文档和 Monorepo 架构说明。
