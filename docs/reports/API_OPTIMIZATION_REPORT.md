# API 简化与重构验证报告

## 1. 改动概述
本次重构针对 Users、Roles、Menus 模块进行了接口精简和优化，旨在减少冗余接口，增强核心接口能力，提升前端调用的便捷性。

## 2. 详细改动

### Users 模块
*   **重置密码**: 移除了独立的 `POST /users/:id/reset-password` 接口。
    *   **新用法**: 使用 `PATCH /users/:id`，在 Body 中传递 `password: "新密码"` 即可。

### Roles 模块
*   **创建/更新**: `CreateRoleDto` 和 `UpdateRoleDto` 新增支持 `menuIds` 和 `permissionIds` 字段。
    *   **新用法**: 在创建或更新角色时，直接传入 ID 数组即可自动处理关联关系，不仅是一步到位，还支持原子性操作。
*   **查询详情**: `GET /roles/:id` 新增 `include` 查询参数。
    *   **新用法**: `GET /roles/123?include=menus,permissions`，返回结果将包含 `menuIds: [...]` 和 `permissionIds: [...]` 数组，便于前端回显。
*   **移除接口**: 删除了以下冗余接口，功能均已合并至标准 CRUD 中：
    *   `assignMenus`
    *   `assignPermissions`
    *   `getRoleMenus`
    *   `getRolePermissions`
    *   `getRoleStats`
    *   `getRoleUserCount`, `getRoleMenuCount`, `getRolePermissionCount`

### Menus 模块
*   **路由校验**: 重构了路由名称检查接口，使其更符合 Restful 规范。
    *   **旧接口**: `GET /menus/route-exist/:routeName`
    *   **新接口**: `GET /menus/validation/route-name?name=HOME`

## 3. 验证结果
*   **编译检查**: 运行 `npm run build` 通过，无类型错误。
*   **依赖清理**: 已清理所有不再使用的 DTO 文件和引用。

## 4. 下一步建议
*   建议前端同步更新 API 调用方式，特别是角色管理页面的“保存”逻辑，现在可以简化为单次请求。
