# API 优化重构报告 (API Optimization Report)

**日期**: 2025-12-23
**状态**: 已完成
**目标**: 针对 `apps/backend` 下的核心业务模块进行 RESTful 接口标准化、去冗余和逻辑统一。

---

## 1. 概述

本项目对后端 API 进行了全面的审查和重构。主要解决以下问题：
*   **接口冗余**: 存在大量功能重复的专用接口（如 `toggle` 开关、专用查询接口）。
*   **命名不规范**: 部分动词路径（RPC 风格）混杂在 RESTful 资源中。
*   **调用方式不统一**: 分页与不分页的逻辑分散在不同端点。

经过优化，所有目标模块均采用了统一的 **RESTful** 设计风格：
*   **查询**: 统一使用 `GET /resource`，通过 Query 参数控制筛选、分页或全量列表。
*   **更新**: 统一使用 `PATCH /resource/:id`，通过 Body 参数更新状态或属性。

---

## 2. 模块变更详情

### 2.1 Contents (内容管理) 模块

*   **查询接口统一**:
    *   ❌ **移除**: `GET /contents/slug/:slug`
    *   ✅ **合并**: `GET /contents?slug=xxx`
    *   **说明**: `findAll` 方法增加了 `slug` 筛选支持。
*   **状态/属性更新统一**:
    *   ❌ **移除**:
        *   `POST /contents/:id/publish`
        *   `POST /contents/:id/unpublish`
        *   `POST /contents/:id/archive`
        *   `PATCH /contents/:id/toggle-recommend`
        *   `PATCH /contents/:id/toggle-top`
        *   `PATCH /contents/:id/toggle-publish`
    *   ✅ **合并**: `PATCH /contents/:id`
    *   **说明**: 更新 DTO 增加了 `status`, `isTop`, `isRecommend` 字段。Service 层逻辑已增强，能根据状态变化自动处理副作用（如设置发布时间、解析 Markdown）。

### 2.2 Projects (项目管理) 模块

*   **查询接口统一**:
    *   ❌ **移除**: `GET /projects/featured`
    *   ✅ **合并**: `GET /projects?featured=true`
*   **属性更新统一**:
    *   ❌ **移除**: `PATCH /projects/:id/toggle-featured`
    *   ✅ **合并**: `PATCH /projects/:id`
    *   **说明**: 更新 DTO 增加了 `featured` 字段。

### 2.3 Roles (角色管理) 模块

*   **查询接口统一**:
    *   ❌ **移除**: `GET /roles/page`
    *   ✅ **合并**: `GET /roles`
    *   **说明**: 统一了列表查询逻辑。
        *   如果传入 `current` / `size`: 返回分页结构 `{ records, total, ... }`。
        *   如果未传入分页参数: 返回全量数组 `Role[]`（适用于前端下拉框选择）。

### 2.4 Permissions (权限管理) 模块

*   **查询接口统一**:
    *   ❌ **移除**:
        *   `GET /permissions/by-type/:type`
        *   `GET /permissions/menu/:menuId`
    *   ✅ **合并**: `GET /permissions`
    *   **说明**: 支持通过 Query 参数 `?type=BUTTON`, `?menuId=xxx`, `?activeOnly=true` 进行组合筛选。

### 2.5 Menus (菜单管理) 模块

*   **查询接口统一**:
    *   ❌ **移除**: `GET /menus/tree`
    *   ✅ **合并**: `GET /menus?format=tree`
    *   **说明**:
        *   增加了 `format` 参数。`format=tree` 返回树形结构。
        *   保留了原有的分页/列表逻辑。当 `format=tree` 或无分页参数时，默认尝试返回该模块的最佳展示形式（树形）。

### 2.6 Users (用户管理) 模块

*   **查询接口优化**:
    *   **优化**: `GET /users`
    *   **说明**: 之前的实现强制分页。现已调整为与 Roles 模块一致：如果不传入 `current` / `size`，则返回全量用户列表（排除密码等敏感信息），方便内部调用或管理界面使用。

---

## 3. 总结

经过本次重构，NestBase 后端的 API 接口数量显著减少，维护成本降低。前端调用逻辑更加一致，减少了对此类“特例”接口的记忆负担。

### 开发规范建议 (New Best Practices)

1.  **避免动词 URL**: 尽量通过 `PATCH` 更新字段来实现状态切换，而不是创建 `/toggle` 或 `/publish` 等动词路径。
2.  **统一入口**: 每个资源尽量只保留一个 `findAll` (GET /) 入口，通过 Query 参数（`type`, `status`, `format` 等）来处理不同的数据视图（列表、分页、树形）。
3.  **智能响应**: 服务端应根据是否接收到分页参数，自动判断是返回 `PageResult` 还是 `Array`。
