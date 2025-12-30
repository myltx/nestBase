# 前端开发指南

本文档面向前端开发人员，详细说明项目的核心配置、开发流程与最佳实践。

## 1. 快速上手

### 1.1 环境配置 (`.env`)

项目根目录下提供了 `.env` 配置文件（或 `.env.development`）。关键变量如下：

```env
# API 服务地址 (本地代理目标)
VITE_SERVICE_BASE_URL=http://localhost:3000

# 开启/关闭 HTTP 代理
VITE_HTTP_PROXY=Y

# 路由模式 (hash | history)
VITE_ROUTER_HISTORY_MODE=history

# 认证通过后的默认首页
VITE_ROUTE_HOME_PATH=/home
```

### 1.2 启动流程

```bash
pnpm install
pnpm dev
```

系统采用 **聚合启动 (Bootstrap)** 模式：

1.  初始化 Pinia Store。
2.  加载本地缓存的主题配置。
3.  **核心**: 调用 `/api/auth/profile` 和 `/api/auth/permissions` 接口。
    - 若 Token 有效：拉取用户信息与权限 -> 动态生成路由 -> 渲染应用。
    - 若无效：重定向至登录页。

---

## 2. 接口请求配置

HTTP 请求模块基于 Axios 封装，位于 `src/service/request`。

### 2.1 定义 API接口

在 `src/service/api` 目录下按模块定义接口。例如 `content.ts`:

```typescript
import { request } from '@/service/request';

/** 获取文章列表 */
export function fetchGetArticleList(params?: Api.SystemManage.ArticleSearchParams) {
  return request<Api.SystemManage.ArticleList>({
    url: '/contents',
    method: 'get',
    params,
  });
}
```

### 2.2 类型定义

建议在 `src/typings/api.d.ts` 或模块内部定义 TypeScript 类型，以获得良好的代码提示。

```typescript
declare namespace Api {
  namespace SystemManage {
    interface Article {
      id: string;
      title: string;
      // ...
    }
  }
}
```

---

## 3. 路由与菜单配置

项目使用 [Elegant Router](https://github.com/soybeanjs/elegant-router) 自动生成路由声明，但也支持手动配置。

### 3.1 新增页面

1.  在 `src/views` 下创建页面组件，例如 `src/views/manage/order/index.vue`。
2.  在路由配置中（或通过后端动态路由）指向该组件。

### 3.2 动态路由 (后端控制)

目前系统开启了后端动态路由模式。菜单数据由 `/api/menus/user-routes` 接口返回。

- **前端组件映射**: 后端返回的 `component` 字段（如 `view.manage_user`）会自动映射到 `src/views/manage/user/index.vue`。
- **映射规则**: `view.` 前缀对应 `src/views` 目录下的文件路径，将 `_` 转换为 `/`。

示例映射关系：

- `view.manage_user` -> `src/views/manage/user/index.vue`
- `view.about` -> `src/views/about/index.vue`
- `layout.base` -> `src/layouts/base-layout/index.vue`

---

## 4. 常用 Hooks 与工具

### 4.1 表格操作 (`useTable`)

`src/hooks/common/table.ts` 提供了极其强大的表格逻辑封装，支持：

- 分页、搜索、加载状态管理。
- 增删改查 (CRUD) 弹窗控制。

```typescript
const {
  data,
  loading,
  getDataByPage,
  searchParams
} = useTable({
  apiFn: fetchGetList,
  apiParams: {
    keyword: ''
  },
  columns: () => [ ... ]
});
```

### 4.2 权限判断 (`useAuthStore`)

```typescript
const auth = useAuthStore();
const canEdit = computed(() => auth.hasPermission('order:edit'));
```

### 4.3 表单校验 (`useForm`)

Naive UI 的表单结合自定义规则：

```typescript
const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
};
```

---

## 5. 调试与排查

- **网络请求**: 查看 Chrome DevTools -> Network，确认 Token 是否携带 (`Authorization: Bearer ...`)。
- **路由问题**: 查看 Vue DevTools -> Routes，确认动态路由是否成功挂载。
- **图标显示**: 项目使用 UnoCSS Iconify，图标类名如 `i-mdi-home`。可以在 [Icones](https://icones.js.org/) 查找图标。

---

> **注意**: 修改 `.env` 文件后需要重启 `pnpm dev` 才能生效。
