# 🚀 NestBase - 现代化全栈基础开发模板

<div align="center">

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

基于 **NestJS + Vue3 + Prisma** 的企业级全栈应用基础模板。采用 **Monorepo** 架构，提供纯净的后台管理系统底座，内置完善的 RBAC 权限体系和 Docker 一键部署能力，摒弃多余业务代码，开箱即用。

[快速开始](#快速开始) • [功能特性](#功能特性) • [Docker 部署](#docker-部署) • [API 文档](#api-文档)

</div>

---

## ✨ 功能特性

### 🔐 认证与权限

- ✅ **完整 RBAC 体系**：用户、角色、权限、菜单的深度关联。
- ✅ **细粒度控制**：支持按钮级/API 级的操作权限控制。
- ✅ **动态路由**：基于后端菜单数据动态生成前端路由。
- ✅ **JWT 认证**：标准的 Access Token + Refresh Token 机制。

### 📦 核心系统模块

- ✅ **用户管理**：账户增删改查、角色分配。
- ✅ **角色管理**：角色创建、权限分配、菜单分配。
- ✅ **菜单管理**：可视化配置系统菜单和路由。
- ✅ **字典管理**：通用数据字典配置（如性别、状态等）。
- ✅ **日志系统**：操作日志与登录日志记录。
- ✅ **仪表盘**：系统运行状态概览。

### 🛠️ 技术架构

- ✅ **Monorepo**：前后端统一管理，类型共享。
- ✅ **Prisma ORM**：类型安全的数据库访问。
- ✅ **Docker 化**：提供完整的 Docker Compose 编排，一键启动全栈环境。
- ✅ **API 标准化**：统一响应格式、全局异常处理、Swagger 文档。

---

## 🚀 快速开始

### 1. 启动 Docker 环境 (推荐)

如果您只想快速预览或部署项目：

```bash
# 构建并启动所有服务（前端 + 后端 + 数据库）
docker-compose up --build
```

启动后访问：

- **前端页面**: http://localhost
- **API 文档**: http://localhost:3000/api-docs

### 2. 本地开发

如果您需要修改代码，建议使用开发模式：

#### 前置要求

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **PostgreSQL** >= 14.x (或使用 Docker 启动 db 服务)

#### 安装依赖

```bash
pnpm install
```

#### 配置环境

复制 `.env.example` 为 `.env` 并配置数据库连接：

```bash
cp apps/backend/.env.example apps/backend/.env
```

#### 数据库初始化

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 推送数据库结构
pnpm prisma:migrate

# 填充初始数据（管理员账户 & 基础字典）
pnpm prisma:seed
```

#### 启动服务

```bash
# 启动后端 (Port: 9423)
pnpm dev:backend

# 启动前端 (Port: 5173)
pnpm dev:frontend

# 启动移动端 H5 (Port: 9000)
pnpm dev:mobile
```

---

## 📖 API 接口概览

### 认证模块 (Auth)

- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/profile` - 获取个人信息

### 用户模块 (User)

- `GET /api/users` - 用户列表
- `GET /api/users/:id/roles` - 用户角色
- `POST /api/users` - 创建用户

### 角色模块 (Role)

- `GET /api/roles` - 角色列表
- `POST /api/roles/:id/menus` - 分配菜单
- `POST /api/roles/:id/permissions` - 分配权限

### 菜单模块 (Menu)

- `GET /api/menus/tree` - 菜单树
- `GET /api/menus/user-routes` - 当前用户路由

### 字典模块 (Dictionary)

- `GET /api/dictionaries` - 字典列表
- `POST /api/dictionaries/:id/items` - 添加字典项

---

## 📂 项目结构

```
nestbase/
├── apps/
│   ├── backend/         # NestJS 后端 (Port: 9423)
│   │   ├── Dockerfile   # 后端镜像构建配置
│   │   └── ...
│   ├── frontend/        # Vue3 前端 (Port: 5173)
│   │   ├── Dockerfile   # 前端镜像构建配置
│   │   └── nginx.conf   # 前端 Nginx 配置
│   └── mobile/          # UniApp 移动端 (NestBase Mobile)
├── docker-compose.yml   # 全栈服务编排
├── package.json         # 根配置
└── ...
```

## 🤝 贡献说明

欢迎提交 Issue 或 Pull Request。

## 📄 许可证

MIT License
