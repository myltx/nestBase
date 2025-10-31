# 角色首页配置功能

## 概述

从 v1.6.0 开始,每个角色可以配置自己的默认首页路由。当用户登录后,系统会根据用户的角色自动跳转到对应的首页。

---

## 数据库变更

### Role 表新增字段

在 `roles` 表中新增 `home` 字段:

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `home` | String | `home` | 角色的默认首页路由(不含前导斜杠) |

```prisma
model Role {
  id              String           @id @default(uuid())
  code            String           @unique
  name            String           @unique
  description     String?
  home            String           @default("home") // 角色默认首页路由(不含/)
  isSystem        Boolean          @default(false) @map("is_system")
  status          Int              @default(1)
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")
  // ... 关联关系
}
```

---

## API 变更

### 1. 创建角色 API

**端点**: `POST /api/roles`

新增可选字段 `home`,用于指定角色的默认首页:

```json
{
  "code": "CUSTOM_ROLE",
  "name": "自定义角色",
  "description": "这是一个自定义角色",
  "home": "dashboard",  // 新增:可选,默认为 home
  "status": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CUSTOM_ROLE",
    "name": "自定义角色",
    "description": "这是一个自定义角色",
    "home": "dashboard",  // 返回设置的首页
    "isSystem": false,
    "status": 1,
    "createdAt": "2025-10-30T...",
    "updatedAt": "2025-10-30T..."
  }
}
```

如果不提供 `home` 字段,将使用数据库默认值 `/home`:
```json
{
  "code": "CUSTOM_ROLE",
  "name": "自定义角色"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "home": "home",  // 使用默认值
    // ... 其他字段
  }
}
```

---

### 2. 更新角色 API

**端点**: `PATCH /api/roles/:id`

可以更新角色的 `home` 字段:

```json
{
  "name": "新角色名称",
  "home": "workspace"  // 更新首页路由
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CUSTOM_ROLE",
    "name": "新角色名称",
    "home": "workspace",  // 已更新
    "isSystem": false,
    "status": 1,
    "createdAt": "2025-10-30T...",
    "updatedAt": "2025-10-30T..."
  }
}
```

**注意**: 系统角色不允许修改任何字段(包括 `home` 字段)。

---

### 3. 为角色分配菜单 API (新增功能)

**端点**: `POST /api/roles/:id/menus`

现在可以在分配菜单的同时更新角色的默认首页:

**请求示例**:
```json
{
  "menuIds": ["uuid1", "uuid2", "uuid3"],
  "home": "dashboard"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "角色菜单分配成功",
    "menuCount": 3,
    "home": "dashboard"
  }
}
```

**字段说明**:
- `menuIds`: 必填，要分配给角色的菜单 ID 数组
- `home`: 可选，角色的默认首页路由。如果提供，将同时更新角色的 `home` 字段

**使用场景**: 在配置角色菜单权限时，一次性设置该角色应该使用哪个页面作为首页。

---

### 4. 获取角色菜单列表 API (返回格式变更)

**端点**: `GET /api/roles/:id/menus`

**旧版本响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "routeName": "home",
      "routePath": "/home",
      "menuName": "首页",
      // ... 其他菜单字段
    }
  ]
}
```

**新版本响应格式** (v1.6.0+):
```json
{
  "success": true,
  "data": {
    "menus": [
      {
        "id": "uuid",
        "routeName": "home",
        "routePath": "/home",
        "menuName": "首页",
        // ... 其他菜单字段
      }
    ],
    "home": "home"
  }
}
```

**变更说明**:
- `menus`: 角色拥有的菜单列表
- `home`: 角色的默认首页路由

---

### 5. 获取用户路由 API (重要变更)

**端点**: `GET /api/menus/user-routes`

**旧版本响应格式**:
```json
{
  "success": true,
  "data": [
    {
      "path": "/home",
      "name": "home",
      "component": "layout.base$view.home",
      "meta": {
        "title": "首页",
        "i18nKey": "route.home",
        // ...
      }
    },
    // ... 更多路由
  ]
}
```

**新版本响应格式** (v1.6.0+):
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "path": "/home",
        "name": "home",
        "component": "layout.base$view.home",
        "meta": {
          "title": "首页",
          "i18nKey": "route.home",
          // ...
        }
      },
      // ... 更多路由
    ],
    "home": "home"  // 新增:用户角色的默认首页
  }
}
```

**说明**:
- `routes`: 用户有权访问的路由列表(树形结构)
- `home`: 用户角色的默认首页路由
- 如果用户有多个角色,使用第一个角色的 `home` 值
- 如果角色没有设置 `home` 字段,默认返回 `home`

---

## 使用场景

### 场景 1: 不同角色不同首页

```typescript
// 管理员角色
{
  code: 'ADMIN',
  name: '管理员',
  home: 'dashboard'  // 跳转到仪表盘
}

// 普通用户角色
{
  code: 'USER',
  name: '普通用户',
  home: 'home'  // 跳转到首页
}

// 编辑者角色
{
  code: 'EDITOR',
  name: '编辑者',
  home: 'editor'  // 跳转到编辑器
}
```

### 场景 2: 前端路由跳转

```typescript
// 前端代码示例
async function getUserRoutes() {
  const response = await fetch('/api/menus/user-routes', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const { data } = await response.json();

  // 设置路由
  router.addRoutes(data.routes);

  // 登录后跳转到角色首页
  router.push(data.home);  // 例如: dashboard, home, editor
}
```

### 场景 3: 多角色用户

如果用户拥有多个角色,例如同时拥有 `ADMIN` 和 `USER` 角色:

```typescript
// 用户的角色列表
user.roles = ['ADMIN', 'USER'];

// API 返回的数据
{
  "routes": [...],  // 合并了两个角色的所有路由
  "home": "dashboard"  // 使用第一个角色(ADMIN)的首页
}
```

---

## 字段验证规则

### home 字段

- **类型**: String
- **必填**: 否(可选)
- **默认值**: `home`
- **验证规则**:
  - 最小长度: 1 个字符
  - 格式: 路由名称,不需要前导斜杠
  - 示例: `home`, `dashboard`, `workspace`, `admin`

```typescript
// CreateRoleDto 中的验证
@ApiProperty({
  description: '角色默认首页路由(不需要前导斜杠)',
  example: 'home',
  required: false,
  default: 'home',
})
@IsOptional()
@IsString()
@MinLength(1, { message: '首页路由不能为空' })
home?: string;
```

---

## 数据迁移指南

### 现有数据库迁移

如果您已经有现有的角色数据,执行 `prisma db push` 后,所有现有角色的 `home` 字段会自动设置为默认值 `/home`。

```bash
# 1. 更新 Prisma schema (已完成)
# 2. 生成 Prisma Client
npx prisma generate

# 3. 推送 schema 变更到数据库
npx prisma db push

# 4. (可选) 运行 seed 脚本更新系统角色
pnpm prisma:seed
```

### 手动更新现有角色

如果需要为现有角色设置特定的首页:

```sql
-- 为管理员角色设置仪表盘首页
UPDATE roles
SET home = 'dashboard'
WHERE code = 'ADMIN';

-- 为编辑者角色设置编辑器首页
UPDATE roles
SET home = 'editor'
WHERE code = 'EDITOR';
```

或使用 Prisma Studio:
```bash
npx prisma studio
# 在 GUI 中编辑 roles 表的 home 字段
```

---

## 前端集成示例

### Vue3 + Vue Router 示例

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia';
import { fetchUserRoutes } from '@/api/menu';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    routes: [],
    home: '/home'
  }),

  actions: {
    async initRoutes() {
      // 获取用户路由和首页
      const { routes, home } = await fetchUserRoutes();

      // 保存数据
      this.routes = routes;
      this.home = home;

      // 动态添加路由
      routes.forEach(route => {
        router.addRoute(route);
      });
    },

    async login(credentials) {
      // 登录
      const { token } = await loginApi(credentials);
      localStorage.setItem('token', token);

      // 初始化路由
      await this.initRoutes();

      // 跳转到角色首页
      router.push(this.home);
    }
  }
});
```

### React + React Router 示例

```typescript
// src/hooks/useAuth.ts
import { useNavigate } from 'react-router-dom';
import { fetchUserRoutes } from '@/api/menu';

export function useAuth() {
  const navigate = useNavigate();

  const login = async (credentials) => {
    // 登录
    const { token } = await loginApi(credentials);
    localStorage.setItem('token', token);

    // 获取路由和首页
    const { routes, home } = await fetchUserRoutes();

    // 保存路由(实际项目中可能需要状态管理)
    // ...

    // 跳转到角色首页
    navigate(home);
  };

  return { login };
}
```

---

## API 完整示例

### 创建角色(带首页配置)

```bash
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "PROJECT_MANAGER",
    "name": "项目经理",
    "description": "项目管理角色",
    "home": "projects",
    "status": 1
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "PROJECT_MANAGER",
    "name": "项目经理",
    "description": "项目管理角色",
    "home": "projects",
    "isSystem": false,
    "status": 1,
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:00:00.000Z"
  }
}
```

### 更新角色首页

```bash
curl -X PATCH http://localhost:3000/api/roles/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "home": "/project-dashboard"
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "code": "PROJECT_MANAGER",
    "name": "项目经理",
    "home": "/project-dashboard",  // 已更新
    "isSystem": false,
    "status": 1,
    "createdAt": "2025-10-30T10:00:00.000Z",
    "updatedAt": "2025-10-30T10:05:00.000Z"
  }
}
```

### 为角色分配菜单并设置首页

```bash
curl -X POST http://localhost:3000/api/roles/550e8400-e29b-41d4-a716-446655440000/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "menuIds": [
      "menu-uuid-1",
      "menu-uuid-2",
      "menu-uuid-3"
    ],
    "home": "projects"
  }'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "角色菜单分配成功",
    "menuCount": 3,
    "home": "projects"
  }
}
```

### 获取角色的菜单列表和首页

```bash
curl -X GET http://localhost:3000/api/roles/550e8400-e29b-41d4-a716-446655440000/menus \
  -H "Authorization: Bearer $TOKEN"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "menus": [
      {
        "id": "menu-uuid-1",
        "routeName": "projects",
        "routePath": "/projects",
        "menuName": "项目管理",
        "i18nKey": "route.projects",
        "icon": "mdi:folder-multiple",
        "order": 1,
        "parentId": null,
        "menuType": 2,
        "status": 1
      },
      {
        "id": "menu-uuid-2",
        "routeName": "home",
        "routePath": "/home",
        "menuName": "首页",
        "i18nKey": "route.home",
        "icon": "mdi:home",
        "order": 2,
        "parentId": null,
        "menuType": 2,
        "status": 1
      }
    ],
    "home": "projects"
  }
}
```

### 获取用户路由和首页

```bash
curl -X GET http://localhost:3000/api/menus/user-routes \
  -H "Authorization: Bearer $TOKEN"
```

**响应**:
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "path": "/projects",
        "name": "projects",
        "component": "layout.base$view.projects",
        "meta": {
          "title": "项目管理",
          "i18nKey": "route.projects",
          "icon": "mdi:folder-multiple",
          "order": 1
        }
      },
      {
        "path": "/home",
        "name": "home",
        "component": "layout.base$view.home",
        "meta": {
          "title": "首页",
          "i18nKey": "route.home",
          "icon": "mdi:home",
          "order": 2
        }
      }
    ],
    "home": "projects"  // 角色的默认首页
  }
}
```

---

## 常见问题 (FAQ)

### Q1: 用户有多个角色时,使用哪个首页?

**A**: 使用第一个角色的 `home` 值。角色顺序由数据库查询结果决定,通常按照创建时间排序。

### Q2: 可以为不同角色设置相同的首页吗?

**A**: 可以。`home` 字段没有唯一性约束,多个角色可以共享同一个首页路由。

### Q3: home 字径可以是外链吗?

**A**: 不建议。`home` 字段设计用于内部路由。如果需要跳转到外链,应该在前端逻辑中处理。

### Q4: 系统角色的 home 可以修改吗?

**A**: 不可以。系统角色的所有字段都不允许通过 API 修改,包括 `home` 字段。需要通过数据库直接修改或更新 seed 文件。

### Q5: 如果 home 路径不存在会怎样?

**A**: 后端不会验证 `home` 路径是否对应实际的菜单/路由。前端在跳转时应该处理路径不存在的情况(如显示 404 页面或跳转到默认页)。

### Q6: 可以动态更改用户的首页吗?

**A**: 首页是角色级别的配置,不是用户级别的。如果需要用户级别的首页配置,需要扩展 User 模型添加 `home` 字段,并修改相关逻辑。

### Q7: 可以在分配菜单时同时设置首页吗?

**A**: 可以。使用 `POST /api/roles/:id/menus` 接口时,在请求体中同时提供 `menuIds` 和 `home` 字段即可。这样可以一次性完成菜单分配和首页设置。

### Q8: 如何只更新首页而不改变菜单?

**A**: 有两种方式:
1. 使用 `PATCH /api/roles/:id` 接口只更新 `home` 字段
2. 使用 `POST /api/roles/:id/menus` 接口,传入当前的 `menuIds` 和新的 `home` 值

### Q9: GET /api/roles/:id/menus 返回格式改变了吗?

**A**: 是的。旧版本返回菜单数组,新版本返回包含 `menus` 和 `home` 的对象。前端需要相应更新代码。

---

## 注意事项

1. **向后兼容性变更**:
   - `/api/menus/user-routes` 返回格式从数组改为对象
   - `/api/roles/:id/menus` 返回格式从数组改为对象
   - 请确保前端代码已更新

2. **默认值**: 所有角色都有默认首页 `/home`,即使未显式设置。

3. **系统角色**: 系统角色的 `home` 字段在 seed 文件中设置,不能通过 API 修改。

4. **路由验证**: 后端不验证 `home` 路径是否有效,前端应处理无效路径的情况。

5. **多角色用户**: 当用户有多个角色时,建议在前端提供切换角色的功能,以便用户选择使用哪个角色的首页。

---

## 相关文件

### 核心文件
- `prisma/schema.prisma` - Role 模型定义(新增 home 字段)
- `src/modules/roles/dto/create-role.dto.ts` - 创建角色 DTO(新增 home 字段)
- `src/modules/roles/dto/update-role.dto.ts` - 更新角色 DTO(继承 home 字段)
- `src/modules/roles/roles.service.ts` - 角色服务(处理 home 字段)
- `src/modules/menus/menus.service.ts` - 菜单服务(返回 home 字段)
- `src/modules/menus/menus.controller.ts` - 菜单控制器

### 数据文件
- `prisma/seed.ts` - 种子数据(为系统角色设置 home 字段)

---

## 版本信息

**功能版本**: v1.6.0
**发布日期**: 2025-10-30
**影响范围**: 角色管理、菜单路由
**相关文档**:
- [角色管理限制说明](./ROLE_RESTRICTIONS.md)
- [菜单管理文档](./MENU_MANAGEMENT.md)

---

## 升级指南

### 从 v1.5.x 升级到 v1.6.0

1. **后端升级**:
   ```bash
   # 拉取最新代码
   git pull

   # 安装依赖
   pnpm install

   # 生成 Prisma Client
   npx prisma generate

   # 推送数据库变更
   npx prisma db push

   # (可选)运行 seed 更新系统角色
   pnpm prisma:seed
   ```

2. **前端升级**:
   ```typescript
   // 旧代码
   const routes = await fetchUserRoutes();
   router.addRoutes(routes);
   router.push('/home');

   // 新代码
   const { routes, home } = await fetchUserRoutes();
   router.addRoutes(routes);
   router.push(home);  // 使用角色配置的首页
   ```

3. **验证升级**:
   - 测试创建角色时可以设置 `home` 字段
   - 测试更新角色的 `home` 字段
   - 测试分配菜单时同时设置 `home` 字段
   - 测试 `/api/roles/:id/menus` 返回包含 `home` 的对象
   - 测试 `/api/menus/user-routes` 返回包含 `home` 的对象
   - 测试不同角色登录后跳转到正确的首页

---

**文档更新日期**: 2025-10-30
