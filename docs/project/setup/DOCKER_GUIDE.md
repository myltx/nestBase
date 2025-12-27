# Docker 支持使用指南

已为项目添加了完整的 Docker 支持。现在你可以使用 Docker Compose 一键启动包含 PostgreSQL 数据库的完整开发环境。

## 已添加的文件

- [Dockerfile](file:///Users/mayunlong/自己的/code/小玩意/nestbase/apps/backend/Dockerfile): 后端应用的构建定义
- [docker-compose.yml](file:///Users/mayunlong/自己的/code/小玩意/nestbase/docker-compose.yml): 服务编排配置
- [.dockerignore](file:///Users/mayunlong/自己的/code/小玩意/nestbase/.dockerignore): 构建忽略配置

## 快速开始

### 1. 启动服务

在项目根目录下运行：

```bash
docker compose up -d
```

这将启动两个容器：

- `nestbase-db`: PostgreSQL 15 数据库 (端口 5432)
- `nestbase-app`: NestJS 后端服务 (端口 3000)

### 2. 初始化数据库

由于是全新的数据库容器，第一次启动后需要同步 Schema：

```bash
# 确保你使用本地的 .env 配置指向 Docker 数据库，或者直接传入环境变量
# 默认 docker-compose 中的 app 服务已经配置好了连接 docker 内数据库的环境变量
```

如果你需要在本机（宿主机）上操作 Docker 中的数据库（例如运行 Prisma migration）：

确保你的 `.env` 文件（或临时环境变量）指向本地端口 5432：

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestbase"
```

然后运行：

```bash
pnpm prisma db push
# 或者
pnpm prisma migrate dev
```

### 3. 查看日志

```bash
docker compose logs -f
```

### 4. 停止服务

```bash
docker compose down
```

## 验证结果

✅ `docker compose config` 配置验证通过。

![Docker Config Success](https://img.shields.io/badge/Docker-Config%20Valid-brightgreen)
