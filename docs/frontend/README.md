# Frontend 前端服务文档

> 📚 **文档版本**: v1.1.0
> 📅 **最后更新**: 2025-12-29
> 🎨 **服务**: Frontend - 基于 Vue 3 的管理后台前端

---

## 🛠 技术栈

- **核心框架**: [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- **UI 组件库**: [Naive UI](https://www.naiveui.com/) + [UnoCSS](https://unocss.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **路由管理**: [Vue Router](https://router.vuejs.org/) + [Elegant Router](https://github.com/soybeanjs/elegant-router)
- **HTTP 请求**: Axios + [Alova](https://alova.js.org/) (部分)

---

## 📂 目录结构

```
apps/frontend/
├── src/
│   ├── assets/             # 静态资源
│   ├── components/         # 通用组件
│   ├── hooks/              # 组合式函数
│   ├── layouts/            # 布局组件
│   ├── locales/            # 国际化语言包
│   ├── router/             # 路由配置 (含 elegant 自动生成)
│   ├── service/            # API 请求封装
│   │   ├── api/            # 接口定义
│   │   └── request/        # Axios 实例与拦截器
│   ├── store/              # Pinia 状态管理
│   │   ├── modules/auth/   # 认证与权限
│   │   ├── modules/route/  # 路由与菜单
│   │   └── ...
│   ├── typings/            # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── views/              # 页面视图
└── vite.config.ts          # Vite 配置
```

---

## 🔐 核心功能指南

### 1. 认证与启动

前端采用了 **聚合启动 (Bootstrap)** 模式来优化登录体验。
详细流程请参考：[👉 前后端联调指南 (认证与启动)](../guides/INTEGRATION.zh-CN.md)

### 2. 权限控制

- **路由权限**: 基于 `roles` 的动态路由生成。
- **按钮权限**: 使用自定义指令 `v-permission="['user.create']"` (待完善)。

### 3. 请求配置

- 配置文件位于 `src/service/request/index.ts`。
- 目前已针对高延迟网络环境调整了超时时间。

---

## 📖 相关文档

- **API 接口定义**: [src/service/api](../apps/frontend/src/service/api)
- **类型定义**: [src/typings/api.d.ts](../apps/frontend/src/typings/api.d.ts)
- **后端文档**: [../backend/README.md](../backend/README.md)
