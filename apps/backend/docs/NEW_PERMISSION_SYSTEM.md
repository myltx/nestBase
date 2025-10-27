# 新权限系统设计文档

## 📐 设计理念

### 核心思想
- **菜单**和**权限**完全分离
- **菜单**只负责路由和页面展示结构
- **权限**控制访问（菜单权限、按钮权限、接口权限）
- **角色**通过 `role_permissions` 表关联权限
- 用户登录后，根据角色查询所有权限

---

## 🗄️ 数据库结构

### Menu（菜单表）
**职责**：定义路由和页面结构

```sql
menus
-----
id              UUID PRIMARY KEY
route_name      VARCHAR UNIQUE    -- 路由标识
route_path      VARCHAR          -- 路由路径
menu_name       VARCHAR          -- 菜单名称
title           VARCHAR          -- 显示标题
icon            VARCHAR          -- 图标
...（其他 UI 相关字段）
```

### Permission（权限表）
**职责**：定义所有权限（菜单/按钮/API）

```sql
permissions
-----------
id              UUID PRIMARY KEY
name            VARCHAR          -- 权限名称，如 "新增用户"、"用户管理页"
code            VARCHAR UNIQUE   -- 权限编码，如 "user:create"、"user:view"
type            ENUM             -- 权限类型：MENU / BUTTON / API
menu_id         UUID NULL        -- 若为 BUTTON/API，隶属于哪个菜单
description     TEXT
status          INT              -- 1:启用 2:禁用
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### RolePermission（角色权限关联表）
**职责**：记录角色拥有的权限

```sql
role_permissions
----------------
id              UUID PRIMARY KEY
role_id         UUID             -- 角色 ID
permission_id   UUID             -- 权限 ID
created_at      TIMESTAMP
```

### RoleMenu（角色菜单关联表）
**职责**：记录角色可见的菜单（用于前端菜单渲染）

```sql
role_menus
----------
id              UUID PRIMARY KEY
role_id         UUID             -- 角色 ID
menu_id         UUID             -- 菜单 ID
created_at      TIMESTAMP
```

---

## 🎯 权限类型说明

### 1. MENU（菜单权限）
- **作用**：控制页面/模块的访问
- **示例**：
  - `user:view` - 用户管理页访问权限
  - `dashboard:view` - 仪表板页访问权限
- **特点**：`menuId` 可为空，表示独立的页面访问权限

### 2. BUTTON（按钮权限）
- **作用**：控制页面内的操作按钮
- **示例**：
  - `user:create` - 新增用户按钮
  - `user:delete` - 删除用户按钮
  - `user:export` - 导出用户数据按钮
- **特点**：**必须**关联 `menuId`，表示隶属于哪个菜单

### 3. API（接口权限）
- **作用**：控制后端 API 的访问
- **示例**：
  - `user:api:create` - POST /api/users
  - `user:api:update` - PATCH /api/users/:id
- **特点**：**必须**关联 `menuId`，也可以独立定义

---

## 🔄 工作流程

### 1. 创建菜单
```
POST /api/menus
{
  "routeName": "user-management",
  "routePath": "/users",
  "menuName": "用户管理",
  "title": "用户管理",
  "icon": "mdi:account-group"
}
```

### 2. 为菜单创建权限
```
POST /api/permissions
{
  "name": "用户管理页",
  "code": "user:view",
  "type": "MENU",
  "menuId": null,  // 菜单权限可以不关联
  "description": "访问用户管理页面"
}

POST /api/permissions
{
  "name": "新增用户",
  "code": "user:create",
  "type": "BUTTON",
  "menuId": "menu-uuid",  // 必须关联菜单
  "description": "新增用户按钮"
}

POST /api/permissions
{
  "name": "删除用户",
  "code": "user:delete",
  "type": "BUTTON",
  "menuId": "menu-uuid",
  "description": "删除用户按钮"
}
```

### 3. 将权限分配给角色
```
POST /api/roles/:roleId/permissions
{
  "permissionIds": [
    "permission-uuid-1",  // user:view
    "permission-uuid-2",  // user:create
    "permission-uuid-3"   // user:delete
  ]
}
```

### 4. 将菜单分配给角色（前端菜单显示）
```
POST /api/roles/:roleId/menus
{
  "menuIds": ["menu-uuid-1", "menu-uuid-2"]
}
```

### 5. 用户登录后获取权限
```
GET /api/auth/permissions

Response:
{
  "success": true,
  "data": {
    "menus": [ ... ],       // 用户可见的菜单
    "permissions": [        // 用户拥有的权限
      {
        "code": "user:view",
        "name": "用户管理页",
        "type": "MENU"
      },
      {
        "code": "user:create",
        "name": "新增用户",
        "type": "BUTTON",
        "menuId": "menu-uuid"
      }
    ]
  }
}
```

---

## 🎨 前端使用示例

### 1. 路由守卫（菜单权限）
```typescript
// 检查用户是否有访问某个页面的权限
function canAccessRoute(route: string, permissions: Permission[]) {
  // 查找对应的菜单权限
  return permissions.some(p =>
    p.type === 'MENU' && p.code === route
  );
}

// 使用
if (!canAccessRoute('user:view', userPermissions)) {
  router.push('/403');
}
```

### 2. 按钮权限控制
```vue
<template>
  <div>
    <!-- 使用 v-if 控制按钮显示 -->
    <button v-if="hasPermission('user:create')">
      新增用户
    </button>

    <button v-if="hasPermission('user:delete')">
      删除用户
    </button>
  </div>
</template>

<script setup>
import { usePermission } from '@/hooks/usePermission';

const { hasPermission } = usePermission();
</script>
```

### 3. 权限 Hook
```typescript
// hooks/usePermission.ts
export function usePermission() {
  const userStore = useUserStore();

  const hasPermission = (code: string) => {
    return userStore.permissions.some(p => p.code === code);
  };

  const hasAnyPermission = (...codes: string[]) => {
    return codes.some(code => hasPermission(code));
  };

  const hasAllPermissions = (...codes: string[]) => {
    return codes.every(code => hasPermission(code));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
```

---

## 🔒 后端权限验证

### 1. 权限守卫
```typescript
// guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredPermissions.every(permission =>
      user.permissions.some(p => p.code === permission)
    );
  }
}
```

### 2. 装饰器使用
```typescript
@Controller('users')
export class UsersController {

  @Post()
  @RequirePermissions('user:create')
  async createUser() {
    // 需要 user:create 权限
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  async deleteUser() {
    // 需要 user:delete 权限
  }
}
```

---

## 📊 数据示例

### 菜单数据
```json
{
  "id": "menu-1",
  "routeName": "user-management",
  "routePath": "/users",
  "menuName": "用户管理",
  "title": "用户管理"
}
```

### 权限数据
```json
[
  {
    "id": "perm-1",
    "name": "用户管理页",
    "code": "user:view",
    "type": "MENU",
    "menuId": null
  },
  {
    "id": "perm-2",
    "name": "新增用户",
    "code": "user:create",
    "type": "BUTTON",
    "menuId": "menu-1"
  },
  {
    "id": "perm-3",
    "name": "删除用户",
    "code": "user:delete",
    "type": "BUTTON",
    "menuId": "menu-1"
  },
  {
    "id": "perm-4",
    "name": "创建用户API",
    "code": "user:api:create",
    "type": "API",
    "menuId": "menu-1"
  }
]
```

---

## ✅ 优势

### 1. 清晰分离
- 菜单只管展示结构
- 权限只管访问控制
- 互不干扰，职责单一

### 2. 灵活配置
- 可以为不同角色分配不同的菜单
- 可以为不同角色分配不同的权限
- 菜单和权限可以独立管理

### 3. 易于扩展
- 新增权限类型方便（如添加 DATA 数据权限）
- 新增权限容易（直接插入权限表）
- 不影响现有菜单结构

### 4. 查询高效
- 用户登录后一次查询获取所有权限
- 前端缓存权限列表
- 无需每次请求都查询权限

---

## 🚀 API 列表

### 菜单管理
- `POST /api/menus` - 创建菜单
- `GET /api/menus` - 查询菜单列表
- `GET /api/menus/:id` - 查询菜单详情
- `PATCH /api/menus/:id` - 更新菜单
- `DELETE /api/menus/:id` - 删除菜单

### 权限管理
- `POST /api/permissions` - 创建权限
- `GET /api/permissions` - 查询权限列表
- `GET /api/permissions/:id` - 查询权限详情
- `PATCH /api/permissions/:id` - 更新权限
- `DELETE /api/permissions/:id` - 删除权限
- `GET /api/menus/:menuId/permissions` - 查询菜单的所有权限

### 角色权限
- `POST /api/roles/:roleId/permissions` - 分配权限给角色
- `GET /api/roles/:roleId/permissions` - 查询角色的权限
- `DELETE /api/roles/:roleId/permissions/:permissionId` - 移除角色权限

### 角色菜单
- `POST /api/roles/:roleId/menus` - 分配菜单给角色
- `GET /api/roles/:roleId/menus` - 查询角色的菜单

### 用户权限
- `GET /api/auth/permissions` - 获取当前用户的权限和菜单

---

**最后更新**: 2025-10-27
