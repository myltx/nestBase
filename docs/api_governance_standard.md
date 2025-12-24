# 接口治理与收敛规范文档 (API Governance & Convergence Standard)

## 1. 核心原则 (Core Principles)

本规范旨在建立一套**可长期演进、低心智负担、风格统一**的 RESTful API 体系。所有新功能开发与旧功能重构必须遵循以下原则：

1.  **资源导向 (Resource-Oriented)**: URL 应名词化，代表资源实体，而非动词化的操作（Action）。
2.  **方法对应 (Method Mapping)**: 严格使用 HTTP Method 表达操作意图 (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)。
3.  **控制层精简 (Thin Controller)**: Controller 仅负责参数校验、权限代理与响应格式化，业务逻辑下沉至 Service。
4.  **参数标准化 (Standardized Review)**: 分页、排序、筛选、树形/扁平格式控制必须使用统一的参数命名。

---

## 2. 接口设计规范 (Interface Design Standards)

### 2.1 基础 CRUD 命名约定

所有模块的基础实体（如 `projects`, `tags`）必须遵循以下标准命名与签名：

| 操作类型 | HTTP 方法 | URL 路径 | 方法名 (Controller) | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **查询列表** | `GET` | `/{resources}` | `findAll` | 支持分页、搜索、排序、格式控制 |
| **查询单个** | `GET` | `/{resources}/:id` | `findOne` | 根据 ID 获取详情 |
| **创建** | `POST` | `/{resources}` | `create` | 创建新资源 |
| **更新** | `PATCH` | `/{resources}/:id` | `update` | 局部更新 (推荐)，仅更新传入字段 |
| **全量替换** | `PUT` | `/{resources}/:id` | `replace` | (不常用) 只有在完全替换资源时使用 |
| **删除** | `DELETE` | `/{resources}/:id` | `remove` | 删除资源 |

**禁止事项**:
*   ❌ 禁止使用 `POST /{path}/list` 来获取列表（除非参数过于复杂超过 URL 长度限制）。
*   ❌ 禁止使用 `GET /{path}/delete` 触发删除。
*   ❌ 禁止在 Controller 中定义 `getById`, `updateInfo` 等非标准命名，统一为 `findOne`, `update`。

### 2.2 状态与业务操作 (Status & Actions)

对于 `enable/disable`, `publish/unpublish` 等状态变更，优先推荐**资源更新模式**，而非**动作模式**。

*   **✅ 推荐**: `PATCH /contents/:id` Body: `{ "status": "PUBLISHED" }`
*   **❌ 避免**: `POST /contents/:id/publish` 或 `PUT /contents/:id/status`

**例外情况**:
当操作包含复杂业务逻辑（不仅仅是改字段），且无法通过 DTO 简单表达时，可使用**子资源**或**特定动作**模式，但需保持全局统一：
*   **动作模式**: `POST /{resources}/:id/actions/{actionName}` (e.g. `POST /vms/:id/actions/restart`)
*   **子资源模式**: `POST /{resources}/:id/view-records` (e.g. 增加浏览记录)

### 2.3 关联关系处理 (Relationships)

对于多对多关系（如 用户<->角色），推荐使用**主资源下的子资源路径**：

| 操作 | 路径 | 语义 | 现有示例 |
| :--- | :--- | :--- | :--- |
| **查询关联** | `GET /{parents}/:id/{children}` | 获取父资源下的子资源列表 | `GET /roles/:id/users` |
| **添加关联** | `POST /{parents}/:id/{children}` | 批量/单条添加关联 | `POST /roles/:id/users` |
| **移除关联** | `DELETE /{parents}/:id/{children}` | 批量/单条移除关联 | `DELETE /roles/:id/users` |

**注意**: 若关联关系极为复杂且独立，可考虑抽象为独立资源（`UserRoles`），但在 URL 上仍应体现层级。

### 2.4 批量操作 (Batch Operations)

批量操作应由 Collection 级接口处理：

*   **批量创建**: `POST /{resources}/batch`
*   **批量删除**: 
    *   方案 A (推荐): `POST /{resources}/batch-delete` Body: `{ ids: [] }` (避免 DELETE 带 Body 的兼容性问题)
    *   方案 B (内部): `DELETE /{resources}` Body: `{ ids: [] }` (需确认网关/代理支持)

---

## 3. 参数与响应规范 (DTO & Response)

### 3.1 统一查询参数 (Query DTO)

所有 `findAll` 接口应继承或实现统一的查询接口：

```typescript
export class QueryBaseDto {
  // 分页
  @ApiProperty({ required: false })
  current?: number;     // 页码，默认 1

  @ApiProperty({ required: false })
  size?: number;        // 页大小，默认 10

  // 排序
  @ApiProperty({ required: false, description: 'sort=createdAt:desc' })
  sort?: string;

  // 关键词搜索
  @ApiProperty({ required: false })
  search?: string;      // 通用模糊搜索

  // 数据格式 return type
  @ApiProperty({ enum: ['tree', 'flat'] })
  format?: 'tree' | 'flat'; // 针对树形数据
}
```

### 3.2 统一响应结构

Controller 返回纯数据或 DTO，由 Global Interceptor 统一包装为 `{ code, data, message }`。
**禁止**在 Controller 中手动包裹 `{ data: ... }`。

---

## 4. 全局接口收敛清单 (Consolidation Guidelines)

基于前几轮分析，以下模式需要持续收敛：

1.  **合并相似的列表查询**:
    *   场景: 有 `findAll`, `findActive`, `findPopular` 等多个接口。
    *   对策: 合并为 `findAll`，通过 Query 参数 `?status=active`, `?sort=popular` 区分。

2.  **收敛独立的统计接口**:
    *   场景: 每个模块都有 `/stats` 且格式各异。
    *   对策: 若统计简单，可作为 `findAll` 的元数据返回；若复杂，统一为 `GET /{resources}/stats`，参数保持一致。

3.  **移除 "Getter/Setter" 风格接口**:
    *   场景: `getRoleMenus`, `assignMenus`, `resetPassword`。
    *   对策: 
        *   `resetPassword` -> `PATCH /users/:id` (字段 `password`)
        *   `assignMenus` -> `PUT /roles/:id` (字段 `menuIds` 全量覆盖) 或 `POST /roles/:id/menus` (增量)

## 5. 项目结构建议

建议逐步调整文件夹结构以反映资源关系而非功能模块：

```
modules/
  ├── users/          # 用户主体
  │   ├── users.controller.ts
  │   └── ...
  ├── roles/          # 角色主体
  │   ├── roles.controller.ts  # 包含 GET /roles/:id/users 等关联操作
  │   └── ...
  ├── auth/           # 认证特殊模块
  └── [resources]/    # 其他资源
```

*如果存在 `user-roles` 这种中间表模块，建议逻辑并入 `Roles` 或 `Users` 模块中作为子资源处理，物理上可保留 Service 拆分，但 API 层面应聚合。*

---

> 此文档作为 `NestBase` 项目后端开发的最高准则。任何 Code Review 均应以此为依据。
