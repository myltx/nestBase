# 项目结构与接口资源分析报告

基于 `docs/api_governance_standard.md` 规范，对 `apps/backend/src/modules` 下的现有结构与接口进行了全量分析。

## 1. 文件夹结构分析 (Folder Structure)

### 1.1 现状概览
当前 `modules` 目录下共有 17 个子模块。大多数模块（如 `projects`, `tags`, `logs`）遵循了“资源导向”的结构，但存在个别“功能导向”或“跨资源”模块，导致职责分散。

### 1.2 模块级评估

| 模块名 | 资源类型 | 评分 | 问题分析 |
| :--- | :--- | :--- | :--- |
| **audit** | 资源 (AuditLog) | ✅ 合理 | 独立资源，清晰。 |
| **auth** | 功能 (Authentication) | ✅ 合理 | 认证是跨切面功能，独立存在合理。 |
| **categories** | 资源 (Category) | ✅ 合理 | 标准资源模块。 |
| **contents** | 资源 (Content) | ✅ 合理 | 标准资源模块。 |
| **home** | 聚合 (Dashboard) | ⚠️ 需改进 | 属于“功能”模块，聚合了统计数据。建议重命名为 `dashboard` 或拆分统计接口到各资源。 |
| **logs** | 资源 (Log) | ✅ 合理 | 标准资源模块。 |
| **menus** | 资源 (Menu) | ✅ 合理 | 标准资源模块。 |
| **permissions**| 资源 (Permission)| ✅ 合理 | 标准资源模块。 |
| **projects** | 资源 (Project) | ✅ 合理 | 标准资源模块。 |
| **roles** | 资源 (Role) | ✅ 合理 | 主要包含角色的 CRUD。 |
| **tags** | 资源 (Tag) | ✅ 合理 | 标准资源模块。 |
| **users** | 资源 (User) | ✅ 合理 | 主要包含用户的 CRUD。 |
| **user-roles** | **中间表/关系** | ❌ **不合理** | **跨资源模块**。物理上将 User-Role 的关系逻辑独立了出来，但在 URL 设计上又分别挂载在 `/users` 和 `/roles` 下。这导致开发者在查找“给用户分配角色”的代码时，不知道该去 `users` 模块找还是 `user-roles` 模块找。 |
| **system** | 功能 (System) | ✅ 合理 | 系统级状态/健康检查。 |

### 1.3 结构优化建议

**核心建议：解散 `user-roles` 模块。**

关联关系（Relationship）应当依附于主资源存在，而不是独立成模块。

1.  **用户侧关系 (`UserRolesUsersController`)** -> 迁移至 **`users` 模块**
    *   作为 `UsersController` 的一部分，或者 `UsersRoleController` (子控制器)。
2.  **角色侧关系 (`UserRolesRolesController`)** -> 迁移至 **`roles` 模块**
    *   作为 `RolesController` 的一部分，或者 `RolesUserController` (子控制器)。
3.  **Service 层** -> 根据复杂度决定：
    *   若简单：直接并在 `UsersService` / `RolesService`。
    *   若复杂：可以在 `users` 模块下保留 `UserRoleService` 作为 helper，但不需要独立的 Module。

---

## 2. 接口资源设计分析 (API Resource Design)

### 2.1 RESTful 风格与规范性

大多数核心模块（Phase 1 & 2 重构后）已高度符合规范。仍存在以下改进点：

#### A. 关联资源路径 (Sub-resources)
目前 `user-roles` 模块实现的接口路径是对的，但物理位置不对。
*   `GET /users/:id/roles` (在 `user-roles` 模块) -> 应移入 `users` 模块管理。
*   `POST /roles/:id/users` (在 `user-roles` 模块) -> 应移入 `roles` 模块管理。

#### B. 批量操作 (Batch Operations)
*   **Tags**: `POST /tags/batch` (存在) -> 符合规范。
*   **Contents**: `DELETE` 批量删除目前通常通常单独实现或缺乏统一模式。建议统一为 `POST /{resource}/batch-delete`。

#### C. 状态操作 (Status/Actions)
*   **Projects**: 存在 `GET /projects/tech-stack` (聚合信息)，符合“子资源/特定数据”模式，合理。
*   **Auth**: `POST /auth/login` 等均为标准 Action，合理。

### 2.2 待合并/冗余接口排查

*   **Users**: 之前移除了 `reset-password` 独立接口，改为 PATCH，已优化。
*   **Roles**: 之前移除了 `assignPermissions` 独立接口，改为 PATCH update 包含 `permissionIds`，已优化。

---

## 3. 落地优化方案 (Actionable Optimization Plan)

### 3.1 推荐的目录结构演进

```text
apps/backend/src/modules/
├── users/                  <-- 聚合用户相关的所有逻辑
│   ├── dto/
│   ├── users.controller.ts     # 处理 /users 基础 CRUD
│   ├── users.roles.controller.ts # (新增) 处理 /users/:id/roles 关联关系
│   ├── users.service.ts
│   └── users.module.ts
├── roles/                  <-- 聚合角色相关的所有逻辑
│   ├── dto/
│   ├── roles.controller.ts     # 处理 /roles 基础 CRUD
│   ├── roles.users.controller.ts # (新增) 处理 /roles/:id/users 关联关系
│   ├── roles.service.ts
│   └── roles.module.ts
├── user-roles/             <-- [DELETE] 该模块应被移除，代码分拆到 users 和 roles
└── ...
```

### 3.2 接口迁移与整理任务

#### 任务 1: 拆分 user-roles 模块
1.  将 `UserRolesService` 中的 `getUserRoles`, `setUserRoles` 方法移入 `UsersService`。
2.  将 `UserRolesService` 中的 `getUsersByRole`, `addUsersToRole`, `removeUsersFromRole` 方法移入 `RolesService`。
3.  将 `UserRolesUsersController` 的路由处理移至 `UsersController` (或新建 `UsersRoleController` 挂载在 `UsersModule`)。
4.  将 `UserRolesRolesController` 的路由处理移至 `RolesController` (或新建 `RolesUserController` 挂载在 `RolesModule`)。
5.  删除 `apps/backend/src/modules/user-roles` 目录。

#### 任务 2: 规范化 Dashboard 模块
1.  将 `home` 模块重命名为 `dashboard` 或 `analytics`，明确其“统计分析”的职责。
2.  确保统计接口 `/dashboard/stats` 的数据源调用各业务 Service 的 `count()` 方法，而不是直接查库，保持业务逻辑主要在资源模块内。

#### 任务 3: 统一批量删除
1.  检查所有主要资源 (`Users`, `Contents`, `Comments` 等)。
2.  若有批量删除需求，统一实现 `POST /batch-delete` 接口，接收 `{ ids: string[] }` DTO。

### 3.3 评分总结

| 维度 | 评分 (1-10) | 评语 |
| :--- | :--- | :--- |
| **RESTful 规范度** | 9/10 | 核心接口重构后非常规范，URL 设计清晰。 |
| **模块职责边界** | 7/10 | `user-roles` 的存在打破了资源边界，是主要扣分项。 |
| **接口统一性** | 8/10 | 查询、分页参数已统一；部分特殊 Action 仍需持续关注。 |

**下一步建议**: 优先执行 **“拆分 user-roles 模块”** 的重构，这将显著提升项目结构的清晰度。
