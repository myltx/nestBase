# 创建菜单时同时创建权限功能说明

## 功能概述

在创建菜单时，支持以下三种方式添加权限：

1. **关联已有权限** - 使用 `permissionIds` 字段
2. **创建新权限** - 使用 `newPermissions` 字段
3. **混合使用** - 同时使用 `permissionIds` 和 `newPermissions`

---

## API 端点

```
POST /api/menus
```

---

## 请求示例

### 1. 仅关联已有权限

```json
{
  "routeName": "user-management",
  "routePath": "/users",
  "menuName": "用户管理",
  "title": "用户管理",
  "icon": "mdi:account-group",
  "permissionIds": [
    "existing-permission-uuid-1",
    "existing-permission-uuid-2"
  ]
}
```

### 2. 仅创建新权限

```json
{
  "routeName": "user-management",
  "routePath": "/users",
  "menuName": "用户管理",
  "title": "用户管理",
  "icon": "mdi:account-group",
  "newPermissions": [
    {
      "code": "user.create",
      "name": "创建用户",
      "description": "允许创建新用户",
      "resource": "user",
      "action": "create",
      "status": 1
    },
    {
      "code": "user.update",
      "name": "更新用户",
      "description": "允许更新用户信息",
      "resource": "user",
      "action": "update"
    }
  ]
}
```

### 3. 混合使用（推荐）

适用于前端场景：部分权限已存在，部分权限需要新建

```json
{
  "routeName": "user-management",
  "routePath": "/users",
  "menuName": "用户管理",
  "title": "用户管理",
  "icon": "mdi:account-group",
  "permissionIds": [
    "existing-permission-uuid-1"
  ],
  "newPermissions": [
    {
      "code": "user.export",
      "name": "导出用户",
      "description": "允许导出用户数据",
      "resource": "user",
      "action": "export",
      "status": 1
    }
  ]
}
```

---

## 响应示例

```json
{
  "success": true,
  "data": {
    "id": "menu-uuid",
    "routeName": "user-management",
    "routePath": "/users",
    "menuName": "用户管理",
    "title": "用户管理",
    "icon": "mdi:account-group",
    "order": 0,
    "status": 1,
    "createdAt": "2025-10-27T...",
    "updatedAt": "2025-10-27T...",
    "permissions": [
      {
        "id": "existing-permission-uuid-1",
        "code": "user.read",
        "name": "查看用户",
        "description": "允许查看用户列表",
        "resource": "user",
        "action": "read",
        "status": 1
      },
      {
        "id": "newly-created-permission-uuid",
        "code": "user.export",
        "name": "导出用户",
        "description": "允许导出用户数据",
        "resource": "user",
        "action": "export",
        "status": 1
      }
    ]
  }
}
```

---

## 字段说明

### CreateMenuDto 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `permissionIds` | `string[]` | 否 | 已有权限的 UUID 数组 |
| `newPermissions` | `CreateMenuPermissionDto[]` | 否 | 新建权限的数据数组 |

### CreateMenuPermissionDto 字段

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `code` | `string` | 是 | 权限代码（唯一） | `user.create` |
| `name` | `string` | 是 | 权限名称（唯一） | `创建用户` |
| `description` | `string` | 否 | 权限描述 | `允许创建新用户` |
| `resource` | `string` | 是 | 资源名称 | `user` |
| `action` | `string` | 是 | 操作类型 | `create` |
| `status` | `number` | 否 | 权限状态（1:启用 2:禁用，默认1） | `1` |

---

## 错误处理

### 1. 权限 ID 不存在

```json
{
  "success": false,
  "message": "部分权限 ID 不存在",
  "statusCode": 404,
  "code": 404
}
```

### 2. 新权限代码已存在

```json
{
  "success": false,
  "message": "权限代码已存在: user.create, user.update",
  "statusCode": 409,
  "code": 409
}
```

### 3. 路由标识已存在

```json
{
  "success": false,
  "message": "路由标识 user-management 已存在",
  "statusCode": 409,
  "code": 409
}
```

---

## 前端使用示例

### React/Vue 示例

```typescript
interface NewPermission {
  code: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  status?: number;
}

interface CreateMenuPayload {
  routeName: string;
  routePath: string;
  menuName: string;
  title: string;
  icon?: string;
  permissionIds?: string[];      // 已选择的已有权限
  newPermissions?: NewPermission[]; // 用户新建的权限
}

// 前端表单处理
const handleCreateMenu = async (formData: CreateMenuPayload) => {
  const response = await fetch('/api/menus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(formData),
  });

  const result = await response.json();

  if (result.success) {
    console.log('菜单创建成功，包含权限:', result.data.permissions);
  }
};
```

### 前端 UI 建议

在菜单新增/编辑页面，建议提供：

1. **权限选择器** - 多选下拉框，选择已有权限
2. **新增权限按钮** - 点击后弹出表单，填写新权限信息
3. **权限列表** - 显示已选权限（区分已有/新建）

```
┌─────────────────────────────────────┐
│  菜单信息                            │
│  ├─ 路由标识: user-management       │
│  ├─ 菜单名称: 用户管理              │
│  └─ ...                             │
├─────────────────────────────────────┤
│  权限配置                            │
│  ┌───────────────────────────────┐  │
│  │ 选择已有权限 ▼                 │  │
│  │  ☑ 查看用户 (user.read)        │  │
│  │  ☐ 删除用户 (user.delete)      │  │
│  └───────────────────────────────┘  │
│                                      │
│  [+ 新增权限]                        │
│                                      │
│  已选权限：                          │
│  • 查看用户 (已有)                   │
│  • 创建用户 (新建) [编辑] [删除]     │
│  • 导出用户 (新建) [编辑] [删除]     │
└─────────────────────────────────────┘
```

---

## 技术实现细节

### Prisma 嵌套创建

使用 Prisma 的嵌套创建功能，在一个事务中完成：

1. 创建菜单
2. 创建新权限
3. 建立菜单-权限关联

```typescript
await prisma.menu.create({
  data: {
    routeName: '...',
    menuPermissions: {
      create: [
        // 关联已有权限
        { permissionId: 'uuid-1' },
        // 创建新权限并关联
        {
          permission: {
            create: {
              code: 'user.create',
              name: '创建用户',
              // ...
            }
          }
        }
      ]
    }
  }
});
```

### 验证逻辑

1. **已有权限验证** - 检查 `permissionIds` 中的所有 UUID 是否存在
2. **新权限唯一性** - 检查 `newPermissions` 中的 `code` 是否已被使用
3. **原子性** - 使用 Prisma 事务确保要么全部成功，要么全部失败

---

## 最佳实践

### 1. 权限命名规范

```typescript
// 推荐格式: resource.action
{
  code: "user.create",
  name: "创建用户",
  resource: "user",
  action: "create"
}
```

### 2. 常见 action 类型

- `create` - 创建
- `read` / `list` - 查看/列表
- `update` / `edit` - 更新/编辑
- `delete` - 删除
- `export` - 导出
- `import` - 导入
- `manage` - 完整管理权限

### 3. 前端状态管理

```typescript
// 建议在前端区分权限来源
interface PermissionItem {
  id?: string;           // 已有权限有 ID
  code: string;
  name: string;
  source: 'existing' | 'new';  // 标记来源
  // ...
}
```

---

## 相关 API

- `GET /api/permissions` - 获取所有权限列表（用于前端选择器）
- `GET /api/menus/:id/permissions` - 获取菜单的权限列表
- `PATCH /api/menus/:id/permissions` - 更新菜单的权限关联

---

**最后更新**: 2025-10-27
