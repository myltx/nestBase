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
    }
}
```

## 4. 文档站点部署

文档站点基于 [VitePress](https://vitepress.dev/) 构建。

### 构建静态资源

```bash
pnpm docs:build
# 构建产物位于 docs/.vitepress/dist
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name docs.your-domain.com;

    location / {
        root /var/www/nestbase/docs/.vitepress/dist;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
```

## 5. 环境变量检查清单

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

## 6. 其他平台部署 (PaaS/Serverless)

### Vercel (推荐前端与文档)

本项目支持直接使用 Vercel 进行部署，特别是前端和文档站点。

**1. 部署前端 (@nestbase/frontend)**

- 在 Vercel 导入 Git 仓库。
- **Root Directory**: 设置为 `apps/frontend`。
- **Framework Preset**: 选择 `Vite`。
- **Environment Variables**: 添加 `.env` 中的变量 (如 `VITE_SERVICE_BASE_URL`)。
- 点击 Deploy。

**2. 部署文档 (docs)**

- 在 Vercel 导入 Git 仓库（新建项目）。
- **Root Directory**: 设置为 `docs`。
- **Framework Preset**: 选择 `VitePress` (或 `Other`，Build command: `pnpm docs:build`, Output: `.vitepress/dist`)。
- 点击 Deploy。

**3. 部署后端 (backend)**

- 虽然 Vercel 支持 NestJS，但建议使用 Serverless 模式适配。
- 自带的 `vercel.json` 配置了基础构建命令，但在 Monorepo 下建议为后端单独配置入口 `api/index.ts` 以适配 Vercel Functions。
- _注意_: 数据库连接池必须支持 Serverless (如 Supabase Transaction Pooler)，否则会耗尽连接。

### GitHub Pages (仅静态站点)

适用于 **文档站点** 或 **纯静态前端**。

1.  在项目根目录创建 `.github/workflows/deploy-docs.yml`:

```yaml
name: Deploy Docs to Pages
on:
  push:
    branches: [main]
    paths: ['docs/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/.vitepress/dist
```

2. 提交代码后，GitHub Actions 会自动构建并发布到 `gh-pages` 分支。
3. 在 GitHub 仓库 Settings -> Pages 中选择 Source 为 `gh-pages` 分支。
