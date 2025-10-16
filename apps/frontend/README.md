# Frontend Application

前端应用预留目录，可以集成以下技术栈：

## 推荐技术栈

### React
- **React** + **Vite** + **TypeScript**
- **TailwindCSS** 或 **Ant Design**
- **React Router** - 路由管理
- **TanStack Query** - 数据获取
- **Zustand** 或 **Redux Toolkit** - 状态管理

### Vue
- **Vue 3** + **Vite** + **TypeScript**
- **Element Plus** 或 **Naive UI**
- **Vue Router** - 路由管理
- **Pinia** - 状态管理

### Next.js（推荐）
- **Next.js 14** + **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **App Router** - 新一代路由
- 内置 API 路由支持

## 快速开始

### 使用 React + Vite

```bash
cd apps/frontend
pnpm create vite . --template react-ts
pnpm install
pnpm dev
```

### 使用 Next.js

```bash
cd apps/frontend
pnpx create-next-app@latest . --typescript --tailwind --app
pnpm dev
```

## 集成后端 API

后端 API 地址：`http://localhost:3000/api`

### 环境变量配置

创建 `.env.local` 文件：

```env
VITE_API_URL=http://localhost:3000/api
# 或 Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### API 调用示例

```typescript
// api/auth.ts
const API_URL = import.meta.env.VITE_API_URL;

export async function login(username: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
}
```

## 项目结构建议

```
apps/frontend/
├── src/
│   ├── api/           # API 调用
│   ├── components/    # 组件
│   ├── pages/         # 页面
│   ├── hooks/         # 自定义 Hooks
│   ├── store/         # 状态管理
│   ├── utils/         # 工具函数
│   └── types/         # TypeScript 类型
├── public/            # 静态资源
└── package.json
```

## 后续步骤

1. 选择前端框架
2. 安装依赖
3. 配置环境变量
4. 开发页面和组件
5. 集成后端 API
