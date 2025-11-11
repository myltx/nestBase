# Monorepo 架构迁移完成 ✅

## 🎉 项目已成功迁移到 Monorepo 架构

### 新的项目结构

```
nestbase/                      # Monorepo 根目录
├── apps/
│   ├── backend/              # ✅ NestJS 后端应用（已完成）
│   │   ├── src/             # 源代码
│   │   ├── prisma/          # 数据库配置
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   └── frontend/            # 🌟 前端应用（预留）
│       ├── README.md        # 前端集成指南
│       └── package.json
├── pnpm-workspace.yaml      # Workspace 配置
├── package.json             # 根配置（统一脚本）
├── README.md                # 主文档（已更新）
└── QUICKSTART.md            # 快速指南（已更新）
```

## 🚀 快速开始（Monorepo 版本）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cd apps/backend
cp .env.example .env
# 编辑 .env 文件填写数据库配置
```

### 3. 初始化数据库

```bash
cd ../..  # 返回根目录
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问：http://localhost:3000/api-docs

## 📋 主要改动

### 新增文件
- ✅ `pnpm-workspace.yaml` - pnpm workspace 配置
- ✅ `apps/backend/` - 后端应用目录
- ✅ `apps/frontend/` - 前端预留目录
- ✅ 新的根 `package.json` - 统一脚本管理

### 更新文件
- ✅ `README.md` - 添加 Monorepo 架构说明
- ✅ `QUICKSTART.md` - 更新为 Monorepo 启动流程
- ✅ `.gitignore` - 支持 Monorepo 结构

### 配置文件
- ✅ `apps/backend/package.json` - 后端专属配置
- ✅ `apps/backend/tsconfig.json` - TypeScript 路径别名已修复
- ✅ `apps/backend/nest-cli.json` - NestJS CLI 配置

## 🎯 常用命令

### 在根目录执行（推荐）

```bash
# 开发
pnpm dev                  # 启动后端开发服务器
pnpm dev:backend          # 同上

# 构建
pnpm build                # 构建后端
pnpm build:backend        # 同上

# 数据库
pnpm prisma:generate      # 生成 Prisma Client
pnpm prisma:migrate       # 运行迁移
pnpm prisma:studio        # 数据库可视化

# 其他
pnpm lint                 # 检查所有应用
pnpm format               # 格式化所有代码
pnpm clean                # 清理编译产物
```

### 在应用目录执行

```bash
cd apps/backend
pnpm dev                  # 直接启动后端
pnpm build                # 构建后端
```

## 🌟 Monorepo 优势

1. **统一依赖管理** - pnpm workspace 自动优化依赖
2. **前后端协作** - 共享类型定义和工具
3. **统一脚本** - 根目录一键操作所有应用
4. **代码复用** - 通过 packages/ 共享代码
5. **一致性** - 统一的代码风格和配置

## 🔧 TypeScript 路径别名

后端应用支持以下路径别名：

```typescript
import { ... } from '@/...'           // src/*
import { ... } from '@common/...'     // src/common/*
import { ... } from '@modules/...'    // src/modules/*
```

配置文件：`apps/backend/tsconfig.json`

## 📦 添加前端应用

查看 `apps/frontend/README.md` 了解如何集成：

- React + Vite + TypeScript
- Vue 3 + Vite + TypeScript
- Next.js 14 + App Router

示例：

```bash
cd apps/frontend
pnpx create-next-app@latest . --typescript --tailwind --app
pnpm dev
```

## ❓ 常见问题

### Q: 如何在前后端共享类型？

A: 创建共享包：

```bash
mkdir -p packages/shared-types
cd packages/shared-types
pnpm init
```

在 `package.json` 中导出类型，然后在前后端导入：

```typescript
import { UserDto } from 'shared-types';
```

### Q: 如何添加更多应用？

A: 在 `apps/` 目录创建新应用，并在 `pnpm-workspace.yaml` 中添加：

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Q: 如何单独构建某个应用？

A: 使用 pnpm filter：

```bash
pnpm --filter backend build
pnpm --filter frontend build
```

## 📚 相关文档

- [README.md](README.md) - 完整项目文档
- [QUICKSTART.md](QUICKSTART.md) - 快速启动指南
- [apps/frontend/README.md](apps/frontend/README.md) - 前端集成指南
- [pnpm workspace 文档](https://pnpm.io/workspaces)

---

**迁移完成时间**：2025-01-15
**架构版本**：Monorepo v1.0
**状态**：✅ 已测试，可以正常运行
