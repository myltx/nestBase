# 用户-角色管理接口文档

> 适配需求：
> 1) 用户管理页：编辑用户 → 修改角色；
> 2) 角色管理页：编辑角色 → 批量添加/移除用户、查看用户分布。

- 基础路径：`/api`（由环境变量 `API_PREFIX` 控制，默认 `api`）
- 认证：默认需携带 JWT；如需公开，请在控制器方法上添加 `@Public()`
- 统一响应：由全局拦截器包装 `{ code, success, data, message, timestamp }`
- 权限建议：
  - 修改用户角色：`user.update`
  - 角色批量用户管理：`role.manage`

---

## 一、接口列表

### 1. 用户侧（编辑用户 → 修改角色）

- `GET  /api/users/:id/roles`
  - 说明：获取指定用户的角色列表
- `PUT  /api/users/:id/roles`
  - 说明：设置指定用户的角色（完全替换）
  - Body（三选一，按你使用的数据建模）：
    - `{ "roleIds": string[] }` 角色表ID列表（关系表建模）
    - `{ "roleKeys": string[] }` 角色编码/唯一键列表（关系表建模）
    - `{ "roles": string[] }` 角色枚举名列表（User.roles 为 enum[] 时）

### 2. 角色侧（编辑角色 → 批量添加/移除用户、查看分布）

- `GET    /api/roles/:id/users`
  - 说明：查看角色下的用户（分页/搜索）
  - Query：`page?`、`pageSize?`、`search?`
- 说明：`:id` 可为角色ID/编码/枚举名，服务端会自动识别（关系失败时回退为枚举查询）
- `POST   /api/roles/:id/users`
  - 说明：批量将用户加入该角色
  - Body：`{ "userIds": string[] }`
- `DELETE /api/roles/:id/users`
  - 说明：批量将用户从该角色移除
  - Body：`{ "userIds": string[] }`

---

## 二、请求/响应示例

> 以下示例默认为受保护接口，需要携带 `Authorization: Bearer <token>`

### 1) 修改用户角色（完全替换）

```bash
curl -X PUT http://localhost:3000/api/users/USER_ID/roles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleIds": ["ROLE_ID_1", "ROLE_ID_2"]
  }'
```

> 若模型使用枚举数组存储角色，`roleIds` 应传入枚举名（如 `ADMIN`、`USER`）。

### 2) 批量添加/移除用户到角色

```bash
# 批量添加
curl -X POST http://localhost:3000/api/roles/ROLE_ID/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "userIds": ["USER_ID_1", "USER_ID_2"] }'

# 批量移除
curl -X DELETE http://localhost:3000/api/roles/ROLE_ID/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "userIds": ["USER_ID_1", "USER_ID_3"] }'
```

### 3) 查看角色下用户分布

```bash
curl -X GET 'http://localhost:3000/api/roles/ROLE_ID/users?page=1&pageSize=20&search=admin' \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

响应示例：

```json
{
  "code": 0,
  "success": true,
  "data": {
    "items": [
      { "id": "user-uuid-1", "email": "admin@example.com", "username": "admin" }
    ],
    "total": 12,
    "page": 1,
    "pageSize": 20
  },
  "message": "success",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

## 三、实现说明（与数据模型的兼容性）

服务端实现兼容两种常见建模：

- 多对多关系表：`user.roles` relation（通过 `connect/set/disconnect`）
- 枚举数组：`user.roles` enum[]（通过 `push/赋值/过滤`）

无需改动前端调用，服务会自动选择适配路径。

相关服务文件：`apps/backend/src/modules/user-roles/user-roles.service.ts`

---

## 四、权限与限流（已在实现中启用）

- 权限码（RequirePermissions）：
  - `PUT /api/users/:id/roles` → `user.update`
  - `POST/DELETE /api/roles/:id/users` → `role.manage`
  - `GET /api/roles/:id/users` → `role.manage`

- 角色限制（Roles）：
  - 以上接口均要求 `ADMIN` 角色

- 限流（RateLimit）：
  - `PUT /api/users/:id/roles` → 60s 内最多 10 次/人
  - `POST /api/roles/:id/users` → 60s 内最多 5 次/人
  - `DELETE /api/roles/:id/users` → 60s 内最多 5 次/人

说明：
- 限流以用户 ID 为主键，若无用户信息则退化为 IP；仅对标记了 `@RateLimit` 的接口生效。
- 审计：角色变更操作会写入审计日志（日志输出 + 可选数据库）。

---

## 五、Swagger 标签

- 统一归属：`@ApiTags('系统 · 用户角色管理')`
- 在 Apifox 中会以中文显示该标签，便于归类

文档入口：`/api-docs`（由 `SWAGGER_PATH` 控制，默认 `api-docs`）。

---

## 六、变更记录

- v1.5.0：新增用户-角色关联接口与文档
