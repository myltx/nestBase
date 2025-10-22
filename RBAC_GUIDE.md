# 🔐 RBAC 权限系统使用指南

本文档详细介绍 NestBase 项目中的 RBAC（基于角色的访问控制）权限系统的设计、实现和使用方法。

---

## 📋 目录

1. [系统架构](#系统架构)
2. [核心概念](#核心概念)
3. [数据模型](#数据模型)
4. [快速开始](#快速开始)
5. [前端权限控制](#前端权限控制)
6. [权限管理](#权限管理)
7. [角色管理](#角色管理)
8. [在代码中使用权限](#在代码中使用权限)
9. [最佳实践](#最佳实践)
10. [常见问题](#常见问题)
11. [API 参考](#api-参考)

---

## 系统架构

### 三层权限模型

NestBase 采用标准的 RBAC 三层权限模型：

```
┌─────────┐     ┌─────────┐     ┌──────────────┐
│  用户   │────▶│  角色   │────▶│    权限      │
│  User   │     │  Role   │     │  Permission  │
└─────────┘     └─────────┘     └──────────────┘
     1:N             N:N              resource.action
```

**关系说明**：
- **用户 → 角色**：一个用户可以拥有多个角色（通过 `UserRole` 表关联）
- **角色 → 菜单**：一个角色可以访问多个菜单（通过 `RoleMenu` 表关联）
- **角色 → 权限**：一个角色可以拥有多个权限（通过 `RolePermission` 表关联）

### 双重控制机制

NestBase 实现了两种互补的访问控制机制：

#### 1. 基于角色的菜单访问控制（粗粒度）

- **控制对象**：前端页面/菜单的可见性
- **实现方式**：`@Roles()` 装饰器 + `RolesGuard`
- **使用场景**：控制用户可以看到哪些菜单和页面
- **示例**：只有 ADMIN 角色可以看到"系统管理"菜单

```typescript
@Roles('ADMIN')
@Get('admin-dashboard')
getAdminDashboard() {
  return this.dashboardService.getAdminData();
}
```

#### 2. 基于权限的 API 操作控制（细粒度）

- **控制对象**：后端 API 的具体操作（CRUD）
- **实现方式**：`@RequirePermissions()` 装饰器 + `PermissionsGuard`
- **使用场景**：控制用户可以执行哪些具体操作
- **示例**：用户必须拥有 `user.delete` 权限才能删除用户

```typescript
@RequirePermissions('user.delete')
@Delete(':id')
deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

### 权限检查流程

```
1. 用户登录
   ↓
2. JWT Token 生成（包含 userId）
   ↓
3. 请求携带 Token
   ↓
4. JwtAuthGuard 验证 Token
   ↓
5. PermissionsGuard 检查权限
   ├── 获取用户的角色（UserRole）
   ├── 获取角色的权限（RolePermission）
   └── 验证是否拥有所需权限
   ↓
6. 执行业务逻辑
```

---

## 核心概念

### 权限（Permission）

权限是系统中最小的访问控制单元，采用 **`resource.action`** 格式：

- **resource**：资源名称（如 user、role、menu、project）
- **action**：操作类型（如 create、read、update、delete）

**系统内置权限示例**：

| 权限代码 | 名称 | 资源 | 操作 | 说明 |
|---------|------|------|------|------|
| `user.create` | 创建用户 | user | create | 允许创建新用户 |
| `user.read` | 查看用户 | user | read | 允许查看用户信息 |
| `user.update` | 更新用户 | user | update | 允许更新用户信息 |
| `user.delete` | 删除用户 | user | delete | 允许删除用户 |
| `role.create` | 创建角色 | role | create | 允许创建新角色 |
| `menu.read` | 查看菜单 | menu | read | 允许查看菜单信息 |
| `project.update` | 更新项目 | project | update | 允许更新项目信息 |

### 角色（Role）

角色是权限的集合，用于批量授予用户一组相关权限。

**系统内置角色**：

| 角色代码 | 角色名称 | 说明 | 默认权限数量 |
|---------|---------|------|-------------|
| `ADMIN` | 管理员 | 拥有系统所有权限 | 20（全部） |
| `MODERATOR` | 协调员 | 拥有部分管理权限（read + update） | 7 |
| `USER` | 普通用户 | 基础用户权限 | 1（project.read） |

### 系统角色与自定义角色

- **系统角色**（`isSystem: true`）：内置角色，不可删除，权限可以修改
- **自定义角色**（`isSystem: false`）：管理员创建的角色，可以删除和修改

---

## 数据模型

### 数据库表结构

```prisma
// 用户表
model User {
  id        String     @id @default(uuid())
  email     String     @unique
  username  String     @unique
  userRoles UserRole[] // 用户角色关联
  // ...
}

// 角色表
model Role {
  id              String           @id @default(uuid())
  code            String           @unique          // 角色代码（如 ADMIN）
  name            String           @unique          // 角色名称（如 管理员）
  description     String?                           // 角色描述
  isSystem        Boolean          @default(false)  // 是否系统角色
  status          Int              @default(1)      // 状态（1=启用，0=禁用）
  userRoles       UserRole[]                        // 用户关联
  roleMenus       RoleMenu[]                        // 菜单关联
  rolePermissions RolePermission[]                  // 权限关联
  // ...
}

// 权限表
model Permission {
  id              String           @id @default(uuid())
  code            String           @unique          // 权限代码（如 user.create）
  name            String           @unique          // 权限名称（如 创建用户）
  description     String?                           // 权限描述
  resource        String                            // 资源名称（如 user）
  action          String                            // 操作类型（如 create）
  isSystem        Boolean          @default(false)  // 是否系统权限
  status          Int              @default(1)      // 状态（1=启用，0=禁用）
  rolePermissions RolePermission[]                  // 角色关联
  // ...
}

// 用户角色关联表
model UserRole {
  id     String @id @default(uuid())
  userId String
  roleId String
  user   User   @relation(...)
  role   Role   @relation(...)
  @@unique([userId, roleId])
}

// 角色权限关联表
model RolePermission {
  id           String     @id @default(uuid())
  roleId       String
  permissionId String
  role         Role       @relation(...)
  permission   Permission @relation(...)
  @@unique([roleId, permissionId])
}

// 角色菜单关联表
model RoleMenu {
  id     String @id @default(uuid())
  roleId String
  menuId String
  role   Role   @relation(...)
  menu   Menu   @relation(...)
  @@unique([roleId, menuId])
}
```

---

## 快速开始

### 1. 初始化权限数据

运行数据库种子脚本会自动创建系统角色、菜单和权限：

```bash
# 在项目根目录执行
pnpm prisma:seed
```

**创建的数据**：
- ✅ 3 个系统角色（ADMIN、MODERATOR、USER）
- ✅ 8 个系统菜单
- ✅ 20 个系统权限（5个资源 × 4个操作）
- ✅ 角色菜单关联
- ✅ 角色权限关联

### 2. 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "admin",
      "roles": ["ADMIN"]
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": "7d"
    }
  }
}
```

### 3. 使用 Token 访问受保护的 API

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 查询所有权限（需要登录）
curl http://localhost:3000/api/permissions \
  -H "Authorization: Bearer $TOKEN"

# 创建新权限（需要 ADMIN 角色）
curl -X POST http://localhost:3000/api/permissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "article.create",
    "name": "创建文章",
    "description": "允许创建新文章",
    "resource": "article",
    "action": "create"
  }'
```

---

## 前端权限控制

NestBase 提供了完整的前端权限控制方案，支持**页面/路由权限**和**按钮/操作权限**两种粒度的控制。

### 权限控制流程

```
用户登录
  ↓
获取用户菜单（控制页面显示）
  ↓
获取用户权限（控制按钮显示）
  ↓
前端渲染（根据权限动态显示/隐藏）
```

### 获取用户权限

#### 1. 获取用户可访问的菜单（页面权限）

```typescript
// API: GET /api/menus/user-routes
// 返回用户基于角色可以访问的菜单树结构

// 请求示例
const response = await fetch('/api/menus/user-routes', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const menus = await response.json();
```

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": [
    {
      "id": "uuid",
      "routeName": "home",
      "routePath": "/home",
      "menuName": "首页",
      "title": "首页",
      "icon": "mdi:home",
      "menuType": 2,
      "component": "layout.base$view.home",
      "children": []
    },
    {
      "id": "uuid",
      "routeName": "manage",
      "routePath": "/manage",
      "menuName": "系统管理",
      "title": "系统管理",
      "icon": "carbon:cloud-service-management",
      "menuType": 1,
      "children": [
        {
          "routeName": "manage_user",
          "routePath": "/manage/user",
          "menuName": "用户管理",
          "title": "用户管理"
        }
      ]
    }
  ]
}
```

#### 2. 获取用户操作权限（按钮权限）

```typescript
// API: GET /api/auth/permissions
// 返回用户拥有的所有权限代码数组

// 请求示例
const response = await fetch('/api/auth/permissions', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { permissions } = await response.json();
```

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": {
    "permissions": [
      "user.create",
      "user.read",
      "user.update",
      "user.delete",
      "role.read",
      "menu.read",
      "project.read",
      "project.update"
    ]
  }
}
```

### 前端实现示例

#### Vue 3 + TypeScript 实现

##### 1. 创建权限存储（Pinia）

```typescript
// stores/permission.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePermissionStore = defineStore('permission', () => {
  // 用户权限列表
  const permissions = ref<string[]>([]);

  // 用户菜单列表
  const menus = ref<any[]>([]);

  // 获取用户权限
  async function fetchPermissions() {
    const response = await fetch('/api/auth/permissions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    permissions.value = data.data.permissions;
  }

  // 获取用户菜单
  async function fetchMenus() {
    const response = await fetch('/api/menus/user-routes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    menus.value = data.data;
  }

  // 检查是否拥有权限
  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission);
  }

  // 检查是否拥有任意权限（OR 逻辑）
  function hasAnyPermission(...perms: string[]): boolean {
    return perms.some(p => permissions.value.includes(p));
  }

  // 检查是否拥有所有权限（AND 逻辑）
  function hasAllPermissions(...perms: string[]): boolean {
    return perms.every(p => permissions.value.includes(p));
  }

  return {
    permissions,
    menus,
    fetchPermissions,
    fetchMenus,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
});
```

##### 2. 创建权限指令

```typescript
// directives/permission.ts
import { Directive } from 'vue';
import { usePermissionStore } from '@/stores/permission';

/**
 * 权限指令
 * 用法: v-permission="'user.delete'" 或 v-permission="['user.delete', 'user.update']"
 */
export const vPermission: Directive = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore();
    const { value } = binding;

    if (!value) return;

    let hasPermission = false;

    if (typeof value === 'string') {
      // 单个权限
      hasPermission = permissionStore.hasPermission(value);
    } else if (Array.isArray(value)) {
      // 多个权限（OR 逻辑）
      hasPermission = permissionStore.hasAnyPermission(...value);
    }

    // 没有权限则隐藏元素
    if (!hasPermission) {
      el.style.display = 'none';
      // 或者直接移除元素
      // el.parentNode?.removeChild(el);
    }
  }
};

/**
 * 权限指令（AND 逻辑）
 * 用法: v-permission-all="['user.delete', 'user.update']"
 */
export const vPermissionAll: Directive = {
  mounted(el, binding) {
    const permissionStore = usePermissionStore();
    const { value } = binding;

    if (!value || !Array.isArray(value)) return;

    const hasPermission = permissionStore.hasAllPermissions(...value);

    if (!hasPermission) {
      el.style.display = 'none';
    }
  }
};
```

##### 3. 注册指令

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { vPermission, vPermissionAll } from './directives/permission';

const app = createApp(App);

// 注册权限指令
app.directive('permission', vPermission);
app.directive('permission-all', vPermissionAll);

app.mount('#app');
```

##### 4. 在组件中使用

```vue
<template>
  <div>
    <h1>用户管理</h1>

    <!-- 方式1: 使用指令控制按钮显示 -->
    <button
      v-permission="'user.create'"
      @click="handleCreate"
    >
      创建用户
    </button>

    <button
      v-permission="'user.delete'"
      @click="handleDelete"
    >
      删除用户
    </button>

    <!-- 方式2: 使用函数判断 -->
    <button
      v-if="hasPermission('user.update')"
      @click="handleUpdate"
    >
      更新用户
    </button>

    <!-- 方式3: 多个权限（OR 逻辑） -->
    <button
      v-permission="['user.update', 'user.create']"
      @click="handleEdit"
    >
      编辑（需要 update 或 create 权限）
    </button>

    <!-- 方式4: 多个权限（AND 逻辑） -->
    <button
      v-permission-all="['user.delete', 'role.delete']"
      @click="handleBatchDelete"
    >
      批量删除（需要同时拥有两个权限）
    </button>
  </div>
</template>

<script setup lang="ts">
import { usePermissionStore } from '@/stores/permission';

const permissionStore = usePermissionStore();
const { hasPermission } = permissionStore;

function handleCreate() {
  console.log('创建用户');
}

function handleDelete() {
  console.log('删除用户');
}

function handleUpdate() {
  console.log('更新用户');
}
</script>
```

#### React + TypeScript 实现

##### 1. 创建权限 Context

```typescript
// contexts/PermissionContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface PermissionContextType {
  permissions: string[];
  menus: any[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    fetchPermissions();
    fetchMenus();
  }, []);

  async function fetchPermissions() {
    const response = await fetch('/api/auth/permissions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setPermissions(data.data.permissions);
  }

  async function fetchMenus() {
    const response = await fetch('/api/menus/user-routes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await response.json();
    setMenus(data.data);
  }

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms: string[]) => {
    return perms.some(p => permissions.includes(p));
  };

  const hasAllPermissions = (...perms: string[]) => {
    return perms.every(p => permissions.includes(p));
  };

  return (
    <PermissionContext.Provider value={{
      permissions,
      menus,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within PermissionProvider');
  }
  return context;
}
```

##### 2. 创建权限组件

```typescript
// components/Permission.tsx
import React from 'react';
import { usePermission } from '@/contexts/PermissionContext';

interface PermissionProps {
  permission?: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Permission({
  permission,
  requireAll = false,
  children,
  fallback = null
}: PermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  if (!permission) return <>{children}</>;

  let hasAccess = false;

  if (typeof permission === 'string') {
    hasAccess = hasPermission(permission);
  } else if (Array.isArray(permission)) {
    hasAccess = requireAll
      ? hasAllPermissions(...permission)
      : hasAnyPermission(...permission);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

##### 3. 在组件中使用

```typescript
// pages/UserManagement.tsx
import React from 'react';
import { Permission } from '@/components/Permission';
import { usePermission } from '@/contexts/PermissionContext';

export function UserManagement() {
  const { hasPermission } = usePermission();

  return (
    <div>
      <h1>用户管理</h1>

      {/* 方式1: 使用 Permission 组件 */}
      <Permission permission="user.create">
        <button onClick={handleCreate}>创建用户</button>
      </Permission>

      <Permission permission="user.delete">
        <button onClick={handleDelete}>删除用户</button>
      </Permission>

      {/* 方式2: 使用 Hook 判断 */}
      {hasPermission('user.update') && (
        <button onClick={handleUpdate}>更新用户</button>
      )}

      {/* 方式3: 多个权限（OR 逻辑） */}
      <Permission permission={['user.update', 'user.create']}>
        <button onClick={handleEdit}>编辑</button>
      </Permission>

      {/* 方式4: 多个权限（AND 逻辑） */}
      <Permission
        permission={['user.delete', 'role.delete']}
        requireAll
      >
        <button onClick={handleBatchDelete}>批量删除</button>
      </Permission>

      {/* 方式5: 带 fallback */}
      <Permission
        permission="user.create"
        fallback={<span>您没有创建权限</span>}
      >
        <button onClick={handleCreate}>创建用户</button>
      </Permission>
    </div>
  );
}
```

### 路由守卫实现

#### Vue Router 路由守卫

```typescript
// router/guards/permission.ts
import { Router } from 'vue-router';
import { usePermissionStore } from '@/stores/permission';

export function setupPermissionGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const permissionStore = usePermissionStore();

    // 如果还没有加载菜单，先加载
    if (permissionStore.menus.length === 0) {
      await permissionStore.fetchMenus();
    }

    // 检查路由是否在用户可访问的菜单中
    const hasRoute = permissionStore.menus.some(
      menu => menu.routeName === to.name
    );

    if (hasRoute || to.meta.public) {
      next();
    } else {
      // 无权访问，跳转到 403 页面
      next({ name: '403' });
    }
  });
}
```

#### React Router 路由守卫

```typescript
// components/PermissionRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/contexts/PermissionContext';

interface PermissionRouteProps {
  requiredPermission?: string;
  children: React.ReactNode;
}

export function PermissionRoute({
  requiredPermission,
  children
}: PermissionRouteProps) {
  const { hasPermission, menus } = usePermission();

  // 检查菜单权限
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
```

### 最佳实践

#### 1. 登录后立即获取权限

```typescript
// 登录成功后
async function handleLogin(credentials) {
  const response = await login(credentials);
  const { token } = response.data;

  // 保存 token
  localStorage.setItem('token', token);

  // 立即获取用户权限和菜单
  const permissionStore = usePermissionStore();
  await Promise.all([
    permissionStore.fetchPermissions(),
    permissionStore.fetchMenus()
  ]);

  // 跳转到首页
  router.push('/');
}
```

#### 2. Token 过期后刷新权限

```typescript
// axios 拦截器
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token 过期，清空权限
      const permissionStore = usePermissionStore();
      permissionStore.$reset();

      // 跳转到登录页
      router.push('/login');
    }
    return Promise.reject(error);
  }
);
```

#### 3. 权限缓存策略

```typescript
// 将权限缓存到 localStorage
const permissionStore = usePermissionStore();

// 保存到本地
localStorage.setItem('permissions', JSON.stringify(permissionStore.permissions));
localStorage.setItem('menus', JSON.stringify(permissionStore.menus));

// 页面刷新时从本地恢复
const cachedPermissions = localStorage.getItem('permissions');
const cachedMenus = localStorage.getItem('menus');

if (cachedPermissions) {
  permissionStore.permissions = JSON.parse(cachedPermissions);
}
if (cachedMenus) {
  permissionStore.menus = JSON.parse(cachedMenus);
}
```

#### 4. 动态菜单生成

```typescript
// 根据用户菜单动态生成路由
function generateRoutes(menus: any[]) {
  return menus.map(menu => ({
    path: menu.routePath,
    name: menu.routeName,
    component: () => import(`@/views/${menu.component}.vue`),
    meta: {
      title: menu.title,
      icon: menu.icon
    },
    children: menu.children ? generateRoutes(menu.children) : []
  }));
}

// 添加到路由
const dynamicRoutes = generateRoutes(permissionStore.menus);
dynamicRoutes.forEach(route => router.addRoute(route));
```

### 注意事项

⚠️ **安全提示**：

1. **前端权限控制只是 UI 层面的控制**，不能替代后端权限验证
2. **后端必须使用 `@Roles()` 或 `@RequirePermissions()` 守卫**保护所有敏感 API
3. **前端权限主要用于提升用户体验**，隐藏用户无权访问的功能
4. **不要在前端代码中硬编码敏感权限逻辑**，始终从后端获取
5. **定期刷新权限数据**，避免权限变更后前端显示不同步

---

## 权限管理

### 查询权限

#### 分页查询所有权限

```bash
GET /api/permissions?page=1&pageSize=10&resource=user&action=create&search=创建
```

**查询参数**：
- `page` - 页码（默认 1）
- `pageSize` - 每页数量（默认 10）
- `resource` - 筛选资源类型（可选）
- `action` - 筛选操作类型（可选）
- `search` - 搜索关键词（匹配 code、name、description）

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "code": "user.create",
        "name": "创建用户",
        "description": "允许创建新用户",
        "resource": "user",
        "action": "create",
        "isSystem": true,
        "status": 1,
        "createdAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 按资源分组查询

```bash
GET /api/permissions/by-resource
```

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": {
    "user": [
      { "code": "user.create", "name": "创建用户", ... },
      { "code": "user.read", "name": "查看用户", ... },
      { "code": "user.update", "name": "更新用户", ... },
      { "code": "user.delete", "name": "删除用户", ... }
    ],
    "role": [ ... ],
    "menu": [ ... ],
    "permission": [ ... ],
    "project": [ ... ]
  }
}
```

### 创建权限

```bash
POST /api/permissions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "article.create",
  "name": "创建文章",
  "description": "允许创建新文章",
  "resource": "article",
  "action": "create"
}
```

**注意事项**：
- ✅ 仅 ADMIN 角色可以创建权限
- ✅ `code` 必须唯一
- ✅ `name` 必须唯一
- ✅ 推荐使用 `resource.action` 格式命名 code

### 更新权限

```bash
PATCH /api/permissions/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "创建文章（新）",
  "description": "允许创建和发布新文章"
}
```

**注意事项**：
- ✅ 仅 ADMIN 角色可以更新权限
- ✅ 系统权限（`isSystem: true`）也可以更新
- ❌ 不建议修改 `code` 字段（可能影响已有代码）

### 删除权限

```bash
DELETE /api/permissions/:id
Authorization: Bearer <admin_token>
```

**注意事项**：
- ✅ 仅 ADMIN 角色可以删除权限
- ⚠️ 删除权限会自动删除所有角色的该权限关联（级联删除）
- ⚠️ 删除后使用该权限的 API 将无法访问

---

## 角色管理

### 为角色分配权限

```bash
POST /api/roles/:roleId/permissions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "permissionIds": [
    "permission-uuid-1",
    "permission-uuid-2",
    "permission-uuid-3"
  ]
}
```

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": {
    "message": "角色权限分配成功",
    "permissionCount": 3
  }
}
```

**注意事项**：
- ✅ 传入空数组 `[]` 会清空该角色的所有权限
- ✅ 每次调用会覆盖之前的权限配置（非增量）
- ✅ 系统会自动验证权限 ID 是否存在

### 查询角色的权限列表

```bash
GET /api/roles/:roleId/permissions
Authorization: Bearer <admin_token>
```

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "user.create",
      "name": "创建用户",
      "resource": "user",
      "action": "create",
      "description": "允许创建新用户"
    },
    {
      "id": "uuid",
      "code": "user.read",
      "name": "查看用户",
      "resource": "user",
      "action": "read"
    }
  ]
}
```

### 查询角色统计信息

```bash
GET /api/roles/:roleId/stats
Authorization: Bearer <admin_token>
```

**响应示例**：
```json
{
  "code": 0,
  "success": true,
  "data": {
    "userCount": 5,
    "menuCount": 8,
    "permissionCount": 20
  }
}
```

---

## 在代码中使用权限

### 使用 @RequirePermissions 装饰器

#### 基本使用

```typescript
import { Controller, Get, Post, Delete } from '@nestjs/common';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@Controller('users')
export class UsersController {
  // 需要 user.read 权限
  @RequirePermissions('user.read')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // 需要 user.create 权限
  @RequirePermissions('user.create')
  @Post()
  create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }

  // 需要 user.delete 权限
  @RequirePermissions('user.delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

#### 需要多个权限（AND 逻辑）

```typescript
// 用户必须同时拥有 user.update 和 user.read 权限
@RequirePermissions('user.update', 'user.read')
@Patch(':id')
updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
  return this.usersService.update(id, updateDto);
}
```

**权限检查逻辑**：
- 用户必须同时拥有列出的所有权限
- 缺少任何一个权限都会返回 403 错误

#### 与 @Roles 装饰器结合使用

```typescript
import { Roles } from '@common/decorators/roles.decorator';

// 既需要 ADMIN 角色，又需要 user.delete 权限
@Roles('ADMIN')
@RequirePermissions('user.delete')
@Delete(':id')
deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

**检查顺序**：
1. `JwtAuthGuard` - 验证是否登录
2. `RolesGuard` - 验证是否拥有所需角色
3. `PermissionsGuard` - 验证是否拥有所需权限

### 在 Service 中检查权限

如果需要在业务逻辑中动态检查权限：

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateUser(userId: string, updateDto: UpdateUserDto, currentUser: any) {
    // 获取用户权限
    const hasPermission = await this.checkUserPermission(
      currentUser.id,
      'user.update'
    );

    if (!hasPermission) {
      throw new ForbiddenException('没有更新用户的权限');
    }

    // 执行更新逻辑
    return this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
    });
  }

  private async checkUserPermission(userId: string, permissionCode: string) {
    // 获取用户角色
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map(ur => ur.roleId);

    // 获取角色权限
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId: { in: roleIds } },
      include: {
        permission: {
          select: { code: true, status: true },
        },
      },
    });

    // 检查是否拥有指定权限
    return rolePermissions.some(
      rp => rp.permission.code === permissionCode && rp.permission.status === 1
    );
  }
}
```

### 为新模块添加权限

#### 步骤 1: 定义权限常量

```typescript
// src/modules/articles/constants/permissions.ts
export const ARTICLE_PERMISSIONS = {
  CREATE: 'article.create',
  READ: 'article.read',
  UPDATE: 'article.update',
  DELETE: 'article.delete',
  PUBLISH: 'article.publish',
} as const;
```

#### 步骤 2: 在 Controller 中使用

```typescript
// src/modules/articles/articles.controller.ts
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { ARTICLE_PERMISSIONS } from './constants/permissions';

@Controller('articles')
export class ArticlesController {
  @RequirePermissions(ARTICLE_PERMISSIONS.CREATE)
  @Post()
  create(@Body() createDto: CreateArticleDto) {
    return this.articlesService.create(createDto);
  }

  @RequirePermissions(ARTICLE_PERMISSIONS.PUBLISH)
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.articlesService.publish(id);
  }
}
```

#### 步骤 3: 在种子脚本中添加权限

```typescript
// prisma/seed.ts
const permissions = [
  // ... 现有权限

  // 文章权限
  {
    code: 'article.create',
    name: '创建文章',
    resource: 'article',
    action: 'create',
    description: '允许创建新文章'
  },
  {
    code: 'article.read',
    name: '查看文章',
    resource: 'article',
    action: 'read',
    description: '允许查看文章内容'
  },
  {
    code: 'article.update',
    name: '更新文章',
    resource: 'article',
    action: 'update',
    description: '允许更新文章内容'
  },
  {
    code: 'article.delete',
    name: '删除文章',
    resource: 'article',
    action: 'delete',
    description: '允许删除文章'
  },
  {
    code: 'article.publish',
    name: '发布文章',
    resource: 'article',
    action: 'publish',
    description: '允许发布文章到公开频道'
  },
];
```

#### 步骤 4: 运行种子脚本

```bash
pnpm prisma:seed
```

#### 步骤 5: 为角色分配权限

通过 API 或 Prisma Studio 为角色分配新创建的权限。

---

## 最佳实践

### 1. 权限命名规范

**✅ 推荐**：
- 使用 `resource.action` 格式
- 资源名称使用单数形式
- 操作名称使用标准 CRUD 动词

```typescript
// ✅ 好的命名
'user.create'
'article.read'
'comment.update'
'project.delete'
'report.export'

// ❌ 不好的命名
'users.create'        // 资源应该用单数
'article-read'        // 应该用点号分隔
'deleteComment'       // 顺序错误
'PROJECT_DELETE'      // 不应该用大写
```

### 2. 权限粒度控制

**原则**：按操作类型划分，而非按业务场景划分

```typescript
// ✅ 推荐：按操作划分
'article.create'
'article.read'
'article.update'
'article.delete'
'article.publish'

// ❌ 不推荐：按场景划分
'article.createDraft'
'article.createAndPublish'
'article.updateTitle'
'article.updateContent'
```

**特殊操作可以单独定义**：
```typescript
'article.publish'      // 发布文章
'article.archive'      // 归档文章
'user.resetPassword'   // 重置密码
'report.export'        // 导出报告
```

### 3. 角色设计原则

#### 基于职责划分角色

```typescript
// ✅ 好的角色设计
{
  code: 'CONTENT_EDITOR',
  name: '内容编辑',
  permissions: [
    'article.create',
    'article.read',
    'article.update',
    'comment.read',
    'comment.delete'
  ]
}

{
  code: 'CONTENT_REVIEWER',
  name: '内容审核员',
  permissions: [
    'article.read',
    'article.publish',
    'article.archive',
    'comment.read',
    'comment.delete'
  ]
}
```

#### 避免权限冗余

```typescript
// ❌ 不好的设计：权限过于冗余
{
  code: 'SUPER_ADMIN',
  permissions: [ /* 所有权限 */ ]
}
{
  code: 'ADMIN',
  permissions: [ /* 几乎所有权限 */ ]
}

// ✅ 好的设计：清晰的职责划分
{
  code: 'ADMIN',
  permissions: [ /* 系统管理权限 */ ]
}
{
  code: 'CONTENT_MANAGER',
  permissions: [ /* 内容管理权限 */ ]
}
{
  code: 'USER_MANAGER',
  permissions: [ /* 用户管理权限 */ ]
}
```

### 4. 守卫使用策略

#### 使用 @Roles 还是 @RequirePermissions？

| 场景 | 推荐使用 | 原因 |
|------|---------|------|
| 前端路由/菜单控制 | `@Roles()` | 粗粒度，便于前端判断 |
| 后端 API 操作控制 | `@RequirePermissions()` | 细粒度，更安全 |
| 管理员专属功能 | 两者结合 | 双重保护 |

**示例**：

```typescript
// 场景1：普通 CRUD 操作 - 仅使用权限
@RequirePermissions('user.delete')
@Delete(':id')
deleteUser(@Param('id') id: string) { ... }

// 场景2：管理后台页面 - 仅使用角色
@Roles('ADMIN', 'MODERATOR')
@Get('dashboard')
getDashboard() { ... }

// 场景3：敏感操作 - 两者结合
@Roles('ADMIN')
@RequirePermissions('user.delete')
@Delete(':id')
deleteUser(@Param('id') id: string) { ... }
```

### 5. 错误处理

#### 自定义权限不足的错误消息

```typescript
import { ForbiddenException } from '@nestjs/common';

@RequirePermissions('user.delete')
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  try {
    return await this.usersService.remove(id);
  } catch (error) {
    if (error instanceof ForbiddenException) {
      throw new ForbiddenException(
        '您没有删除用户的权限，请联系管理员申请 user.delete 权限'
      );
    }
    throw error;
  }
}
```

### 6. 测试权限系统

```typescript
// users.controller.spec.ts
describe('UsersController', () => {
  it('should deny access without user.delete permission', async () => {
    const user = { id: 'user-id', roles: ['USER'] };

    const response = await request(app.getHttpServer())
      .delete('/users/test-id')
      .set('Authorization', `Bearer ${getTokenForUser(user)}`)
      .expect(403);

    expect(response.body.message).toContain('user.delete');
  });

  it('should allow access with user.delete permission', async () => {
    const admin = { id: 'admin-id', roles: ['ADMIN'] };

    await request(app.getHttpServer())
      .delete('/users/test-id')
      .set('Authorization', `Bearer ${getTokenForUser(admin)}`)
      .expect(200);
  });
});
```

---

## 常见问题

### Q1: 如何查看用户拥有哪些权限？

**方法 1：通过 API 查询**

```bash
# 1. 查询用户的角色
GET /api/users/:userId

# 2. 查询每个角色的权限
GET /api/roles/:roleId/permissions
```

**方法 2：通过 Prisma Studio 查看**

```bash
pnpm prisma:studio
```

然后依次查看 `UserRole` → `RolePermission` → `Permission` 表。

### Q2: 为什么用户有 ADMIN 角色但还是被拒绝访问？

**可能原因**：

1. **使用了 @RequirePermissions 但角色没有对应权限**

   ```typescript
   // Controller 代码
   @Roles('ADMIN')  // 用户有 ADMIN 角色 ✅
   @RequirePermissions('article.delete')  // 但 ADMIN 角色没有这个权限 ❌
   @Delete(':id')
   deleteArticle(@Param('id') id: string) { ... }
   ```

   **解决方案**：为 ADMIN 角色分配 `article.delete` 权限

2. **权限被禁用了**

   权限的 `status` 字段为 0（禁用状态）

   **解决方案**：更新权限 `status` 为 1

3. **JWT Token 过期**

   **解决方案**：重新登录获取新 Token

### Q3: 如何实现 OR 逻辑的权限检查？

当前 `@RequirePermissions()` 使用 AND 逻辑（必须拥有所有权限）。

如果需要 OR 逻辑（拥有任一权限即可），可以：

**方案 1：在 Service 层实现**

```typescript
async updateArticle(id: string, dto: UpdateArticleDto, currentUser: any) {
  const hasUpdatePermission = await this.hasPermission(currentUser.id, 'article.update');
  const hasPublishPermission = await this.hasPermission(currentUser.id, 'article.publish');

  if (!hasUpdatePermission && !hasPublishPermission) {
    throw new ForbiddenException('需要 article.update 或 article.publish 权限');
  }

  // 执行更新逻辑
}
```

**方案 2：创建自定义装饰器**

```typescript
// src/common/decorators/require-any-permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_ANY_PERMISSIONS_KEY = 'requireAnyPermissions';

export const RequireAnyPermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_ANY_PERMISSIONS_KEY, permissions);
```

然后创建对应的 Guard（留作练习）。

### Q4: 如何批量更新角色权限？

```bash
# 获取所有权限
GET /api/permissions

# 筛选出需要的权限 ID
# 例如：所有 read 操作的权限

# 为角色分配权限
POST /api/roles/:roleId/permissions
{
  "permissionIds": ["id1", "id2", "id3", ...]
}
```

**提示**：可以编写脚本批量处理

```typescript
// scripts/assign-permissions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignReadPermissions() {
  // 获取所有 read 权限
  const readPermissions = await prisma.permission.findMany({
    where: { action: 'read' },
    select: { id: true },
  });

  const permissionIds = readPermissions.map(p => p.id);

  // 查找 MODERATOR 角色
  const moderatorRole = await prisma.role.findUnique({
    where: { code: 'MODERATOR' },
  });

  // 删除现有关联
  await prisma.rolePermission.deleteMany({
    where: { roleId: moderatorRole.id },
  });

  // 创建新关联
  await prisma.rolePermission.createMany({
    data: permissionIds.map(permissionId => ({
      roleId: moderatorRole.id,
      permissionId,
    })),
  });

  console.log(`✅ 已为 MODERATOR 分配 ${permissionIds.length} 个 read 权限`);
}

assignReadPermissions()
  .finally(() => prisma.$disconnect());
```

### Q5: 如何实现资源级别的权限控制？

例如：用户只能编辑自己创建的文章。

**方案：在 Service 层添加所有权检查**

```typescript
@Injectable()
export class ArticlesService {
  async update(id: string, updateDto: UpdateArticleDto, currentUser: any) {
    // 1. 检查文章是否存在
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 2. 检查是否是文章作者或拥有管理员权限
    const isAuthor = article.authorId === currentUser.id;
    const isAdmin = currentUser.roles.includes('ADMIN');

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('您只能编辑自己创建的文章');
    }

    // 3. 执行更新
    return this.prisma.article.update({
      where: { id },
      data: updateDto,
    });
  }
}
```

### Q6: 系统权限可以删除吗？

**技术上可以删除**（`isSystem` 只是标记），但**强烈不建议**删除系统权限，因为：

1. 可能导致现有代码中的 `@RequirePermissions()` 失效
2. 可能影响种子脚本的幂等性
3. 可能导致角色权限关联数据不一致

**建议做法**：
- 如果不想使用某个系统权限，将其 `status` 设置为 0（禁用）
- 或者从角色中移除该权限，但保留权限记录

---

## API 参考

### 权限 API

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|---------|
| POST | `/api/permissions` | 创建权限 | ADMIN 角色 |
| GET | `/api/permissions` | 分页查询权限 | 需要登录 |
| GET | `/api/permissions/by-resource` | 按资源分组查询 | 需要登录 |
| GET | `/api/permissions/:id` | 查询权限详情 | 需要登录 |
| PATCH | `/api/permissions/:id` | 更新权限 | ADMIN 角色 |
| DELETE | `/api/permissions/:id` | 删除权限 | ADMIN 角色 |

### 角色权限 API

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|---------|
| POST | `/api/roles/:id/permissions` | 为角色分配权限 | ADMIN 角色 |
| GET | `/api/roles/:id/permissions` | 获取角色的权限列表 | ADMIN 角色 |
| GET | `/api/roles/:id/permissions/count` | 获取角色的权限数量 | ADMIN 角色 |
| GET | `/api/roles/:id/stats` | 获取角色统计信息 | ADMIN 角色 |

### 完整 API 文档

访问 Swagger 文档获取完整的 API 信息：

```
http://localhost:3000/api-docs
```

---

## 附录

### 系统内置权限列表

| 权限代码 | 名称 | 资源 | 操作 | 说明 |
|---------|------|------|------|------|
| `user.create` | 创建用户 | user | create | 允许创建新用户 |
| `user.read` | 查看用户 | user | read | 允许查看用户信息 |
| `user.update` | 更新用户 | user | update | 允许更新用户信息 |
| `user.delete` | 删除用户 | user | delete | 允许删除用户 |
| `role.create` | 创建角色 | role | create | 允许创建新角色 |
| `role.read` | 查看角色 | role | read | 允许查看角色信息 |
| `role.update` | 更新角色 | role | update | 允许更新角色信息 |
| `role.delete` | 删除角色 | role | delete | 允许删除角色 |
| `menu.create` | 创建菜单 | menu | create | 允许创建新菜单 |
| `menu.read` | 查看菜单 | menu | read | 允许查看菜单信息 |
| `menu.update` | 更新菜单 | menu | update | 允许更新菜单信息 |
| `menu.delete` | 删除菜单 | menu | delete | 允许删除菜单 |
| `permission.create` | 创建权限 | permission | create | 允许创建新权限 |
| `permission.read` | 查看权限 | permission | read | 允许查看权限信息 |
| `permission.update` | 更新权限 | permission | update | 允许更新权限信息 |
| `permission.delete` | 删除权限 | permission | delete | 允许删除权限 |
| `project.create` | 创建项目 | project | create | 允许创建新项目 |
| `project.read` | 查看项目 | project | read | 允许查看项目信息 |
| `project.update` | 更新项目 | project | update | 允许更新项目信息 |
| `project.delete` | 删除项目 | project | delete | 允许删除项目 |

### 系统内置角色权限分配

#### ADMIN（管理员）

拥有所有 20 个系统权限

#### MODERATOR（协调员）

拥有以下 7 个权限：
- `user.read`
- `user.update`
- `role.read`
- `menu.read`
- `permission.read`
- `project.read`
- `project.update`

#### USER（普通用户）

拥有以下 1 个权限：
- `project.read`

---

**文档版本**: v1.0.0
**最后更新**: 2025-10-22
**项目版本**: v1.4.0

如有疑问或建议，请提交 Issue 或联系开发团队。
