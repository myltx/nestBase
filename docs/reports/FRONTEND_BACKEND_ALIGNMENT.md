# 接口一致性分析报告

## 1. 概述

本报告对前端 (`apps/frontend`) 的 API 调用定义与后端 (`apps/backend`) 的实际接口实现进行了对比分析，旨在发现潜在的调用错误。

## 2. 分析结果汇总

| 模块                 | 状态      | 匹配数 | 不一致数 | 备注                         |
| :------------------- | :-------- | :----- | :------- | :--------------------------- |
| **认证 (Auth)**      | ⚠️ 有风险 | 3      | 1        | Refresh Token 接口路径不匹配 |
| **用户 (User)**      | ✅ 通过   | 3      | 0        | 核心 CRUD 接口一致           |
| **菜单/路由 (Menu)** | ⚠️ 有风险 | 2      | 1        | 路由存在性检查接口风格不统一 |

## 3. 详细不一致项

### 3.1 认证模块 - 刷新 Token

- **前端定义**: `POST /auth/refreshToken`
  - 文件: `apps/frontend/src/service/api/auth.ts`
- **后端实现**: `POST /auth/refresh`
  - 文件: `apps/backend/src/modules/auth/auth.controller.ts`
- **建议**: 修改前端调用路径为 `/refresh`。

### 3.2 菜单模块 - 路由名称检查

- **前端定义**: `GET /menus/route-exist/:routeName` (路径参数)
  - 文件: `apps/frontend/src/service/api/route.ts`
- **后端实现**: `GET /menus/validation/route-name?name=:name` (查询参数)
  - 文件: `apps/backend/src/modules/menus/menus.controller.ts`
- **建议**: 修改前端调用为 Query 参数形式，路径调整为 `/validation/route-name`。

## 4. 匹配项

以下关键接口已确认一致：

- `POST /auth/login`
- `GET /auth/profile`
- `GET /auth/permissions`
- `GET /users` (列表查询)
- `POST /users` (创建用户)
- `PATCH /users/:id` (更新用户)
- `GET /menus/constant-routes`
- `GET /menus/user-routes`

## 5. 结论

大部分核心业务接口是一致的，但存在 **2 个关键路径不匹配**，可能会导致：

1. Token 过期后无法自动刷新，导致用户被登出。
2. 创建菜单/路由时无法正确校验名称重复。

建议立即修复前端代码以匹配后端实现。
