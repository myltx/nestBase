# 🔄 RBAC 权限系统重新设计方案

## 📋 设计目标

将原有的分离式权限管理（菜单 + 权限）统一为一个**树形权限表**，通过 `type` 字段区分不同类型的权限节点。

## 🎯 核心优势

### 原有设计的问题
- ❌ 菜单和权限分离，管理复杂
- ❌ 无法直接表达"菜单下的按钮"这种层级关系
- ❌ API 权限和菜单权限割裂
- ❌ 需要维护两套数据结构

### 新设计的优势
- ✅ 统一管理：菜单、按钮、API 接口都是权限节点
- ✅ 树形结构：天然表达层级关系（菜单 → 按钮 → API）
- ✅ 灵活扩展：可以轻松添加新的权限类型
- ✅ 前后端一致：前端直接使用权限树渲染菜单和控制按钮

## 🗄️ 新的数据模型

### 权限表结构

```prisma
// 统一权限模型（菜单 + 按钮 + API）
model Permission {
  id              String       @id @default(uuid())

  // ========== 基础字段 ==========
  code            String       @unique              // 权限代码（唯一标识）
  name            String                            // 权限名称
  description     String?                           // 权限描述
  type            PermissionType                    // 权限类型

  // ========== 树形结构 ==========
  parentId        String?      @map("parent_id")    // 父权限ID
  parent          Permission?  @relation("PermissionHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children        Permission[] @relation("PermissionHierarchy")

  // ========== 菜单专用字段 ==========
  routePath       String?      @map("route_path")   // 路由路径（菜单类型专用）
  component       String?                           // 组件路径（菜单类型专用）
  icon            String?                           // 图标（菜单/按钮类型）
  i18nKey         String?      @map("i18n_key")     // 国际化key

  // ========== API专用字段 ==========
  apiPath         String?      @map("api_path")     // API路径（如 /api/users）
  method          HttpMethod?                       // HTTP方法（GET, POST, PUT, DELETE）

  // ========== 显示控制 ==========
  sort            Int          @default(0)          // 排序
  visible         Boolean      @default(true)       // 是否可见
  status          Int          @default(1)          // 状态（1:启用 2:禁用）

  // ========== 系统字段 ==========
  isSystem        Boolean      @default(false) @map("is_system")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  rolePermissions RolePermission[]

  @@map("permissions")
}

// 权限类型枚举
enum PermissionType {
  MENU     // 菜单（一级、二级等菜单）
  BUTTON   // 按钮（页面内的操作按钮）
  API      // API接口（后端接口权限）
}

// HTTP方法枚举（仅API类型使用）
enum HttpMethod {
  GET
  POST
  PUT
  PATCH
  DELETE
}
```

### 权限树示例

```
用户管理（MENU）
├─ 用户列表（MENU）
│  ├─ 新建用户按钮（BUTTON）
│  │  └─ POST /api/users（API）
│  ├─ 编辑用户按钮（BUTTON）
│  │  ├─ GET /api/users/:id（API）
│  │  └─ PATCH /api/users/:id（API）
│  ├─ 删除用户按钮（BUTTON）
│  │  └─ DELETE /api/users/:id（API）
│  └─ 导出用户按钮（BUTTON）
│     └─ GET /api/users/export（API）
├─ 角色管理（MENU）
│  ├─ 分配权限按钮（BUTTON）
│  │  └─ POST /api/roles/:id/permissions（API）
│  └─ 查看权限按钮（BUTTON）
│     └─ GET /api/roles/:id/permissions（API）
```

### 数据示例

| id | code | name | type | parentId | routePath | apiPath | method | sort | visible |
|----|------|------|------|----------|-----------|---------|--------|------|---------|
| 1 | user-management | 用户管理 | MENU | null | /user-management | null | null | 1 | true |
| 2 | user-list | 用户列表 | MENU | 1 | /user-management/list | null | null | 1 | true |
| 3 | user-create-btn | 新建用户 | BUTTON | 2 | null | null | null | 1 | true |
| 4 | user-create-api | 创建用户接口 | API | 3 | null | /api/users | POST | 1 | false |
| 5 | user-edit-btn | 编辑用户 | BUTTON | 2 | null | null | null | 2 | true |
| 6 | user-edit-get-api | 获取用户接口 | API | 5 | null | /api/users/:id | GET | 1 | false |
| 7 | user-edit-update-api | 更新用户接口 | API | 5 | null | /api/users/:id | PATCH | 2 | false |

## 🔄 角色权限关联

保持原有的 `RolePermission` 关联表不变：

```prisma
model RolePermission {
  id           String     @id @default(uuid())
  roleId       String     @map("role_id")
  permissionId String     @map("permission_id")
  role         Role       @relation(...)
  permission   Permission @relation(...)
  createdAt    DateTime   @default(now())

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}
```

## 🎨 前端使用场景

### 1. 渲染菜单

```typescript
// 获取当前用户的所有权限
const permissions = await fetchUserPermissions();

// 筛选菜单类型的权限
const menuPermissions = permissions.filter(p => p.type === 'MENU');

// 构建树形菜单
const menuTree = buildTree(menuPermissions);
```

### 2. 控制按钮显示

```vue
<template>
  <div>
    <!-- 只有拥有 user-create-btn 权限才显示新建按钮 -->
    <button v-if="hasPermission('user-create-btn')">
      新建用户
    </button>

    <!-- 只有拥有 user-edit-btn 权限才显示编辑按钮 -->
    <button v-if="hasPermission('user-edit-btn')">
      编辑用户
    </button>
  </div>
</template>

<script setup>
import { usePermission } from '@/hooks/usePermission';

const { hasPermission } = usePermission();
</script>
```

### 3. API 权限验证

后端通过权限守卫验证：

```typescript
// 装饰器检查按钮权限（会自动检查其下的 API 权限）
@RequirePermissions('user-create-btn')
@Post()
createUser(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

## 📊 权限继承规则

### 规则说明

1. **授予父权限 → 自动拥有所有子权限**
   - 例如：授予"用户管理"菜单 → 自动拥有"用户列表"、"新建用户"等所有子权限

2. **授予按钮权限 → 自动拥有其下的 API 权限**
   - 例如：授予"新建用户按钮" → 自动拥有"POST /api/users"接口权限

3. **可以单独授予 API 权限（用于第三方调用）**
   - 例如：某个外部系统只需要"GET /api/users"接口权限，不需要菜单和按钮

### 权限检查逻辑

```typescript
/**
 * 检查用户是否拥有指定权限
 * @param userId 用户ID
 * @param permissionCode 权限代码
 * @returns boolean
 */
async function checkPermission(userId: string, permissionCode: string): Promise<boolean> {
  // 1. 获取用户的所有权限（包括通过角色获得的权限）
  const userPermissions = await getUserPermissions(userId);

  // 2. 直接拥有该权限
  if (userPermissions.includes(permissionCode)) {
    return true;
  }

  // 3. 检查是否拥有父权限（递归向上查找）
  const permission = await findPermissionByCode(permissionCode);
  if (permission.parentId) {
    return checkPermission(userId, permission.parent.code);
  }

  return false;
}
```

## 🔧 实现步骤

### 阶段一：数据库迁移（保留现有数据）

1. ✅ 创建新的权限表结构
2. ✅ 将现有菜单数据迁移到权限表（type=MENU）
3. ✅ 将现有权限数据迁移到权限表（type=API）
4. ✅ 保留旧表，确保数据安全

### 阶段二：Service 层改造

1. ✅ 创建 PermissionsService（支持树形查询）
2. ✅ 实现权限继承逻辑
3. ✅ 实现权限检查守卫

### 阶段三：Controller 层改造

1. ✅ 提供权限树查询接口
2. ✅ 提供按类型筛选接口
3. ✅ 提供权限继承关系查询接口

### 阶段四：前端集成

1. ✅ 提供前端权限判断工具函数
2. ✅ 提供菜单渲染工具
3. ✅ 提供按钮权限指令

## 🚀 API 设计

### 获取权限树

```http
GET /api/permissions/tree
Authorization: Bearer <token>

Response:
{
  "code": 0,
  "success": true,
  "data": [
    {
      "id": "1",
      "code": "user-management",
      "name": "用户管理",
      "type": "MENU",
      "icon": "mdi:account-group",
      "sort": 1,
      "children": [
        {
          "id": "2",
          "code": "user-list",
          "name": "用户列表",
          "type": "MENU",
          "routePath": "/user-management/list",
          "children": [
            {
              "id": "3",
              "code": "user-create-btn",
              "name": "新建用户",
              "type": "BUTTON",
              "children": [
                {
                  "id": "4",
                  "code": "user-create-api",
                  "name": "创建用户接口",
                  "type": "API",
                  "apiPath": "/api/users",
                  "method": "POST",
                  "visible": false
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 按类型获取权限

```http
GET /api/permissions?type=MENU
GET /api/permissions?type=BUTTON
GET /api/permissions?type=API
```

### 获取当前用户的权限树

```http
GET /api/auth/permissions-tree
Authorization: Bearer <token>

Response: 返回用户有权访问的权限树（自动过滤无权限的节点）
```

## 📝 命名规范

### 权限 Code 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 菜单（MENU） | `{module}-{page}` | `user-management`, `user-list` |
| 按钮（BUTTON） | `{module}-{action}-btn` | `user-create-btn`, `user-edit-btn` |
| API（API） | `{module}-{action}-api` | `user-create-api`, `user-update-api` |

### 特殊场景

- 目录菜单：`{module}`（如 `system`）
- 页面菜单：`{module}-{page}`（如 `system-settings`）
- 多级菜单：`{module}-{sub}-{page}`（如 `system-log-access`）

## 🎯 最佳实践

### 1. 权限粒度

- ✅ **菜单级别**：控制用户能看到哪些页面
- ✅ **按钮级别**：控制用户能执行哪些操作
- ✅ **API级别**：后端接口权限验证

### 2. 权限设计原则

- **最小权限原则**：默认无权限，显式授权
- **职责分离**：不同角色拥有不同权限组合
- **继承关系**：合理使用父子关系减少配置

### 3. 性能优化

- 权限数据缓存（Redis）
- 权限树懒加载
- 用户权限预计算

## ⚠️ 注意事项

### 数据迁移

1. **不删除旧表**：先创建新表，迁移数据后再删除
2. **数据映射**：
   - 旧 `Menu` 表 → 新 `Permission` 表（type=MENU）
   - 旧 `Permission` 表 → 新 `Permission` 表（type=API）
   - 旧 `RoleMenu` 表 → 新 `RolePermission` 表
   - 旧 `RolePermission` 表 → 新 `RolePermission` 表

### 兼容性

- 保持 API 接口向后兼容
- 提供数据迁移脚本
- 逐步废弃旧接口

## 📅 实施计划

| 阶段 | 任务 | 预计时间 |
|------|------|---------|
| 1 | 设计评审 | 1 天 |
| 2 | Prisma Schema 更新 | 1 天 |
| 3 | 数据迁移脚本 | 1 天 |
| 4 | Service 层改造 | 2 天 |
| 5 | Controller 层改造 | 1 天 |
| 6 | 测试 | 1 天 |
| 7 | 文档更新 | 1 天 |
| **总计** | **全部** | **8 天** |

---

**设计版本**: v2.0.0
**设计日期**: 2025-10-22
**设计者**: Claude Code
