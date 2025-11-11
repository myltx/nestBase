# 菜单管理文档

## 概述

菜单管理系统提供了完整的菜单CRUD操作、树形结构查询、常量菜单管理和角色权限关联功能。

---

## 核心概念

### 菜单类型 (menuType)

- `1` - **目录类型**: 顶层菜单分类,不能有父菜单 (parentId 必须为 null)
- `2` - **菜单类型**: 普通菜单项,可以有父菜单

### 常量菜单 (constant)

- `true` - **常量菜单**: 系统预设的固定菜单,通常用于登录、注册等无需权限验证的页面路由
- `false` - **动态菜单**: 根据角色权限动态显示的菜单

**注意**:
- 常量菜单主要用于前端路由配置,表示该路由是固定存在的
- 但在后端API层面,所有菜单接口(包括获取常量菜单)都需要JWT认证
- 常量菜单不等于公开访问,只是表示该菜单不需要角色权限控制

### 菜单状态 (status)

- `1` - **启用**: 菜单正常显示
- `2` - **禁用**: 菜单不显示

### 字段不可变性

- **parentId**: 创建后不可修改 (需要修改请删除重建)
- **routeName**: 路由标识,必须唯一,创建后不可修改

---

## API 接口

### 基础 CRUD

#### 1. 创建菜单

**接口**: `POST /api/menus`
**权限**: `@Roles('ADMIN')`
**请求体**:

```json
{
  "routeName": "home",           // 必填,路由标识(唯一)
  "routePath": "/home",          // 必填,路由路径
  "menuName": "首页",            // 可选,菜单名称
  "i18nKey": "route.home",       // 可选,国际化key
  "iconType": 1,                 // 可选,图标类型 (1=iconify, 2=本地)
  "icon": "mdi:home",            // 可选,图标名称
  "order": 1,                    // 可选,排序
  "parentId": null,              // 可选,父菜单ID (目录类型必须为null)
  "menuType": 1,                 // 必填,菜单类型 (1=目录 2=菜单)
  "component": "layout.base",    // 可选,组件路径
  "hideInMenu": false,           // 可选,是否隐藏
  "keepAlive": true,             // 可选,是否缓存
  "constant": false,             // 可选,是否为常量菜单
  "status": 1                    // 可选,状态 (1=启用 2=禁用)
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "routeName": "home",
    "routePath": "/home",
    ...
  }
}
```

**验证规则**:
- 目录类型 (menuType=1) 不能设置 parentId
- routeName 必须唯一
- 如果指定 parentId,父菜单必须存在

#### 2. 查询所有菜单 (分页+树形)

**接口**: `GET /api/menus`
**权限**: `@Roles('ADMIN')`
**查询参数**:

```
?search=关键词        # 可选,搜索菜单名称或路由标识
&rootOnly=true       # 可选,只返回根菜单
&activeOnly=true     # 可选,只返回启用的菜单
&parentId=uuid       # 可选,指定父菜单ID
&current=1           # 可选,页码 (默认1)
&size=10            # 可选,每页数量 (默认10)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "routeName": "dashboard",
        "routePath": "/dashboard",
        "menuName": "仪表盘",
        "children": [
          {
            "id": "uuid2",
            "routeName": "dashboard_analysis",
            "routePath": "/dashboard/analysis",
            "menuName": "分析页",
            "children": []
          }
        ]
      }
    ],
    "current": 1,
    "size": 10,
    "total": 20,
    "totalPages": 2
  }
}
```

**特性**:
- 只分页顶层菜单,但递归返回所有子菜单
- 返回树形结构,包含所有层级

#### 3. 获取菜单树形结构

**接口**: `GET /api/menus/tree`
**权限**: `@Roles('ADMIN')`
**查询参数**:

```
?activeOnly=true      # 可选,只返回启用的菜单
&constantOnly=true    # 可选,只返回常量菜单
&constantOnly=false   # 可选,只返回非常量菜单
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "routeName": "dashboard",
      "constant": false,
      "children": [...]
    }
  ]
}
```

**用途**:
- `constantOnly=true`: 获取所有常量菜单,用于前端固定路由配置
- `constantOnly=false`: 获取所有动态菜单,用于角色权限配置
- 不传 `constantOnly`: 获取所有菜单

#### 4. 获取常量菜单路由

**接口**: `GET /api/menus/constant-routes`
**权限**: 需要登录 (JWT认证)
**查询参数**: 无

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "routeName": "login",
      "routePath": "/login",
      "menuName": "登录",
      "constant": true,
      "children": []
    }
  ]
}
```

**特性**:
- 只返回 `constant=true` 且 `status=1` 的菜单
- 返回树形结构
- 过滤掉 `hideInMenu=true` 的叶子菜单
- 如果父菜单有子菜单则保留,即使父菜单设置了 hideInMenu

**用途**:
- 前端获取固定路由配置 (如登录、注册、404等)
- 这些路由不需要角色权限控制,但仍需登录才能访问接口

#### 5. 获取当前用户的路由菜单

**接口**: `GET /api/menus/user-routes`
**权限**: 需要登录 (JWT认证)
**查询参数**: 无

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "routeName": "dashboard",
      "routePath": "/dashboard",
      "children": [...]
    }
  ]
}
```

**特性**:
- 根据当前用户的角色自动过滤菜单
- 只返回用户有权限访问的菜单
- 只返回启用状态 (status=1) 的菜单
- 返回树形结构

**实现逻辑**:
1. 获取用户的所有角色 codes (如 ['ADMIN', 'USER'])
2. 通过角色 codes 查询角色 IDs
3. 通过角色 IDs 查询 RoleMenu 表获取菜单 IDs
4. 根据菜单 IDs 构建树形结构

#### 6. 获取所有菜单的路由名称列表

**接口**: `GET /api/menus/route-names`
**权限**: `@Roles('ADMIN')`
**查询参数**: 无

**响应**:
```json
{
  "success": true,
  "data": [
    "dashboard",
    "dashboard_analysis",
    "system",
    "system_user"
  ]
}
```

**用途**:
- 用于前端权限配置
- 用于菜单选择器

#### 7. 根据 ID 查询菜单

**接口**: `GET /api/menus/:id`
**权限**: `@Roles('ADMIN')`

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "routeName": "dashboard",
    "parent": {...},      // 父菜单信息
    "children": [...]     // 子菜单列表
  }
}
```

#### 8. 更新菜单

**接口**: `PATCH /api/menus/:id`
**权限**: `@Roles('ADMIN')`
**请求体**: (所有字段可选)

```json
{
  "routePath": "/new-path",
  "menuName": "新名称",
  "status": 2
}
```

**注意**:
- `parentId` 不可修改 (即使传入也会被忽略)
- `routeName` 可以修改,但必须保证唯一性
- 目录类型 (menuType=1) 的菜单不能修改为有父菜单

#### 9. 删除菜单

**接口**: `DELETE /api/menus/:id`
**权限**: `@Roles('ADMIN')`

**响应**:
```json
{
  "success": true,
  "data": {
    "message": "菜单删除成功"
  }
}
```

**验证**:
- 如果有子菜单,无法删除 (需要先删除子菜单)
- 删除菜单会级联删除相关的角色菜单关联 (RoleMenu)

---

## 数据库模型

### Menu 表

```prisma
model Menu {
  id              String   @id @default(uuid())
  routeName       String   @unique @map("route_name")        // 路由标识(唯一)
  routePath       String   @map("route_path")               // 路由路径
  menuName        String?  @map("menu_name")                // 菜单名称
  i18nKey         String?  @map("i18n_key")                 // 国际化key
  iconType        Int?     @map("icon_type")                // 图标类型
  icon            String?                                    // 图标名称
  localIcon       String?  @map("local_icon")               // 本地图标
  iconFontSize    Int?     @map("icon_font_size")           // 图标大小
  order           Int      @default(0)                      // 排序
  parentId        String?  @map("parent_id")                // 父菜单ID
  menuType        Int      @map("menu_type")                // 菜单类型
  component       String?                                    // 组件路径
  href            String?                                    // 外链地址
  hideInMenu      Boolean  @default(false) @map("hide_in_menu")      // 是否隐藏
  activeMenu      String?  @map("active_menu")              // 激活的菜单
  multiTab        Boolean  @default(false) @map("multi_tab") // 是否支持多标签
  fixedIndexInTab Int?     @map("fixed_index_in_tab")       // 固定在标签页的位置
  keepAlive       Boolean  @default(true) @map("keep_alive") // 是否缓存
  constant        Boolean  @default(false)                   // 是否为常量路由
  query           Json?    @db.JsonB                        // 路由参数
  status          Int      @default(1)                      // 状态
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  parent          Menu?         @relation("MenuToMenu", fields: [parentId], references: [id], onDelete: Cascade)
  children        Menu[]        @relation("MenuToMenu")
  roleMenus       RoleMenu[]
  permissions     Permission[]

  @@map("menus")
}
```

---

## 使用场景

### 场景 1: 创建系统菜单结构

```bash
# 1. 创建顶层目录
curl -X POST http://localhost:9423/api/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeName": "system",
    "routePath": "/system",
    "menuName": "系统管理",
    "menuType": 1,
    "icon": "carbon:settings",
    "constant": false,
    "status": 1
  }'

# 2. 创建子菜单
curl -X POST http://localhost:9423/api/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeName": "system_user",
    "routePath": "/system/user",
    "menuName": "用户管理",
    "menuType": 2,
    "parentId": "system-uuid",
    "component": "view.system_user",
    "constant": false,
    "status": 1
  }'
```

### 场景 2: 创建常量菜单 (登录页面等)

```bash
curl -X POST http://localhost:9423/api/menus \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routeName": "login",
    "routePath": "/login",
    "menuName": "登录",
    "menuType": 2,
    "component": "view.login",
    "constant": true,
    "hideInMenu": true,
    "status": 1
  }'
```

### 场景 3: 前端获取菜单数据

```typescript
// 1. 获取常量路由 (用于路由配置)
const constantRoutes = await api.get('/api/menus/constant-routes');

// 2. 获取用户动态路由 (根据角色权限)
const userRoutes = await api.get('/api/menus/user-routes');

// 3. 合并路由配置
const allRoutes = [...constantRoutes, ...userRoutes];
```

### 场景 4: 管理员配置菜单权限

```bash
# 1. 获取所有非常量菜单 (用于权限配置)
curl -X GET 'http://localhost:9423/api/menus/tree?constantOnly=false' \
  -H "Authorization: Bearer $TOKEN"

# 2. 获取所有常量菜单 (查看固定路由)
curl -X GET 'http://localhost:9423/api/menus/tree?constantOnly=true' \
  -H "Authorization: Bearer $TOKEN"
```

---

## 常见问题

### Q1: constant 字段的作用?

**A**: `constant` 字段用于标识菜单是否为系统固定路由:
- `constant=true`: 常量菜单,不受角色权限控制,所有用户都能看到 (如登录、注册、404)
- `constant=false`: 动态菜单,根据角色权限动态显示

**注意**: 常量菜单仍然需要JWT认证才能访问后端接口,只是不需要特定角色权限。

### Q2: 为什么目录类型不能有父菜单?

**A**: 这是系统设计的约束:
- 目录类型 (menuType=1) 是顶层分类,用于组织菜单结构
- 菜单类型 (menuType=2) 是实际的菜单项,可以在目录下

如果需要多级菜单,可以使用 menuType=2 并设置 parentId。

### Q3: parentId 为什么不可修改?

**A**: 为了保证菜单树结构的稳定性:
- 修改父菜单可能导致循环引用
- 修改父菜单可能违反业务规则 (如目录不能有父菜单)
- 如需修改层级关系,建议删除后重建

详见: [PARENT_ID_IMMUTABLE.md](./PARENT_ID_IMMUTABLE.md)

### Q4: 如何区分常量菜单和动态菜单的使用场景?

**A**:
- **常量菜单** (`constant=true`):
  - 系统固定页面: 登录、注册、找回密码
  - 错误页面: 404、403、500
  - 公共页面: 关于我们、帮助中心
  - 这些页面所有用户都能访问,不需要权限控制

- **动态菜单** (`constant=false`):
  - 业务功能页面: 用户管理、角色管理、订单管理
  - 数据统计页面: 报表、仪表盘
  - 系统配置页面: 参数设置、字典管理
  - 这些页面需要根据用户角色动态显示

### Q5: /menus/constant-routes 和 /menus/user-routes 的区别?

**A**:

| 接口 | 权限 | 数据来源 | 用途 |
|------|------|----------|------|
| `/menus/constant-routes` | JWT认证 | `constant=true` 的菜单 | 前端固定路由配置 |
| `/menus/user-routes` | JWT认证 | 用户角色关联的菜单 | 前端动态路由配置 |

前端通常需要同时调用这两个接口,合并结果作为完整的路由配置。

### Q6: 如何修复菜单查询返回空的问题?

**A**: 如果 `/menus/user-routes` 返回空,检查:
1. 用户是否有角色: 查看 `user_roles` 表
2. 角色是否有菜单: 查看 `role_menus` 表
3. 菜单是否启用: `status=1`
4. 角色 code 是否正确: 确保角色 code 与 JWT token 中的 roles 数组匹配

参考问题修复: 在 v1.5.0 中修复了 `findByRoles()` 方法,正确处理了角色 code 到 role ID 的转换。

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 40001 | 参数验证失败 |
| 40003 | 目录类型菜单不能设置父菜单 |
| 40401 | 菜单不存在 |
| 40901 | 路由标识已存在 |
| 40003 | 父菜单不存在 |
| 40003 | 该菜单下有子菜单,无法删除 |

---

## 最佳实践

### 1. 菜单命名规范

```
routeName: 使用下划线分隔,体现层级关系
  - dashboard
  - system_user
  - system_role

routePath: 使用斜杠分隔,符合 URL 规范
  - /dashboard
  - /system/user
  - /system/role

menuName: 简洁明了的中文名称
  - 仪表盘
  - 用户管理
  - 角色管理
```

### 2. 排序 (order) 规范

```
建议使用 10 的倍数,便于后续插入:
- 首页: 10
- 仪表盘: 20
- 系统管理: 30
  - 用户管理: 31
  - 角色管理: 32
```

### 3. 图标使用建议

```typescript
// iconType = 1: 使用 iconify
{
  "iconType": 1,
  "icon": "mdi:home"  // 格式: {collection}:{icon}
}

// iconType = 2: 使用本地图标
{
  "iconType": 2,
  "localIcon": "home"  // 对应 @/assets/icons/home.svg
}
```

### 4. 组件路径规范

```typescript
// 布局组件
component: "layout.base"
component: "layout.blank"

// 视图组件
component: "view.home"
component: "view.system_user"

// 对应前端路由配置:
const modules = import.meta.glob('@/views/**/*.vue');
```

---

## 数据迁移

### 添加 constant 字段

如果你的数据库中已有菜单数据,需要添加 `constant` 字段:

```sql
-- 1. 添加 constant 字段 (Prisma migrate 会自动执行)
ALTER TABLE menus ADD COLUMN constant BOOLEAN DEFAULT false;

-- 2. 标记已有的常量菜单
UPDATE menus SET constant = true
WHERE route_name IN ('login', 'register', '404', '403', '500');

-- 3. 确保常量菜单不隐藏
UPDATE menus SET hide_in_menu = false
WHERE constant = true AND menu_type = 2;
```

---

## 相关文档

- [角色管理限制](./ROLE_RESTRICTIONS.md) - 角色系统的保护机制
- [创建菜单并关联权限](./CREATE_MENU_WITH_PERMISSIONS.md) - 菜单权限配置
- [新权限系统](./NEW_PERMISSION_SYSTEM.md) - 权限系统架构
- [父菜单ID不可变](./PARENT_ID_IMMUTABLE.md) - parentId 字段限制说明

---

**文档版本**: v1.6.0
**最后更新**: 2025-10-29
**相关功能**: RBAC 权限系统、菜单管理、路由配置
