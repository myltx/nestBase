# 部署指南

本文档提供 NestBase 项目的生产环境部署方案，包括 Docker 容器化部署、PM2 传统部署以及 Nginx 反向代理配置。

## 1. 部署架构

推荐的生产环境架构：

- **前端**: 构建静态文件 -> Nginx 托管 / CDN 分发
- **后端**: Docker 容器 / PM2 进程 -> Nginx 反向代理
- **数据库**: 托管 PostgreSQL (Supabase/AWS RDS) 或 自建 Docker
- **缓存**: Redis (可选)

## 2. 后端部署

### A. Docker 部署 (推荐)

项目根目录已包含 `Dockerfile`。

1.  **构建镜像**

    ```bash
    docker build -t nestbase-backend .
    ```

2.  **启动容器**
    ```bash
    docker run -d \
      --name nestbase-api \
      -p 3000:3000 \
      --env-file apps/backend/.env \
      nestbase-backend
    ```

### B. PM2 部署

适用于传统云服务器环境。

1.  **安装依赖与构建**

    ```bash
    pnpm install
    pnpm build:backend
    ```

2.  **启动进程**

    ```bash
    cd apps/backend
    pm2 start dist/main.js --name "nestbase-api"
    ```

3.  **日志监控**
    ```bash
    pm2 logs nestbase-api
    pm2 monit
    ```

## 3. 前端部署

### 构建静态资源

```bash
pnpm build:frontend
# 构建产物位于 apps/frontend/dist
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    location / {
        root /var/www/nestbase/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 4. 环境变量检查清单

生产环境部署前，请务必检查以下变量：

| 变量名           | 推荐值/说明                                  |
| :--------------- | :------------------------------------------- |
| `NODE_ENV`       | `production`                                 |
| `JWT_SECRET`     | **必须**修改为长随机字符串                   |
| `DATABASE_URL`   | 使用连接池地址 (Transaction Mode)            |
| `DIRECT_URL`     | 使用直连地址 (Session Mode)                  |
| `CORS_ORIGIN`    | 限制为前端域名，如 `https://your-domain.com` |
| `SWAGGER_ENABLE` | 生产环境建议设为 `false` 关闭文档            |

## 5. 常见问题

**Q: 部署后刷新页面 404？**
A: 前端路由模式为 history 时，Nginx 必须配置 `try_files $uri $uri/ /index.html;`。

**Q: 数据库迁移怎么跑？**
A: 可以在 CI/CD 流程中运行，或在容器启动脚本中添加 `npx prisma migrate deploy`。
