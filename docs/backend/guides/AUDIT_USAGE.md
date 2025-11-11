# 审计日志使用指南

## 概述

审计日志模块用于记录系统中的关键操作，包括用户操作、权限变更、角色管理等，便于追踪和审计。

## 数据库表结构

`audit_logs` 表包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| event | String | 事件名称，如 "role:update", "permission:grant" |
| userId | UUID (可选) | 操作用户ID |
| ipAddress | String (可选) | 操作IP地址 |
| userAgent | String (可选) | 用户代理 |
| resource | String (可选) | 资源类型，如 "Role", "Permission", "Menu" |
| resourceId | UUID (可选) | 资源ID |
| action | String (可选) | 操作类型：CREATE, UPDATE, DELETE |
| payload | JSON | 事件详细数据 |
| result | String | 操作结果（默认：SUCCESS）可选：FAILED |
| errorMsg | String (可选) | 错误信息 |
| createdAt | DateTime | 创建时间 |

## 在 Service 中记录审计日志

### 1. 注入 AuditService

```typescript
import { AuditService } from '@modules/audit/audit.service';

@Injectable()
export class YourService {
  constructor(private readonly audit: AuditService) {}
}
```

### 2. 记录操作日志

```typescript
// 基本用法
await this.audit.log({
  event: 'user:create',
  userId: currentUser.id,
  resource: 'User',
  resourceId: newUser.id,
  action: 'CREATE',
  payload: {
    email: newUser.email,
    userName: newUser.userName,
  },
});

// 带 IP 和 User-Agent
await this.audit.log({
  event: 'role:update',
  userId: currentUser.id,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
  resource: 'Role',
  resourceId: role.id,
  action: 'UPDATE',
  payload: {
    before: oldRoleData,
    after: newRoleData,
  },
});

// 记录失败操作
await this.audit.log({
  event: 'permission:grant',
  userId: currentUser.id,
  resource: 'Permission',
  resourceId: permissionId,
  action: 'UPDATE',
  result: 'FAILED',
  errorMsg: error.message,
  payload: {
    roleId,
    permissionId,
  },
});

// 系统操作（无用户）
await this.audit.log({
  event: 'system:startup',
  action: 'SYSTEM',
  payload: {
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  },
});
```

## 查询审计日志 API

### 1. 获取审计日志列表（分页）

**接口**: `GET /api/audit-logs`

**权限**: 仅管理员（ADMIN）

**查询参数**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| current | Number | 否 | 当前页码（默认：1） | 1 |
| size | Number | 否 | 每页数量（默认：20） | 20 |
| event | String | 否 | 事件名称（模糊搜索） | role:update |
| userId | String | 否 | 用户ID | uuid |
| resource | String | 否 | 资源类型 | Role |
| startDate | String | 否 | 开始日期（ISO 8601） | 2025-01-01T00:00:00.000Z |
| endDate | String | 否 | 结束日期（ISO 8601） | 2025-12-31T23:59:59.999Z |

**请求示例**:

```bash
# 获取所有审计日志（第一页，每页 20 条）
curl -X GET "http://localhost:3000/api/audit-logs?current=1&size=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 查询特定用户的操作
curl -X GET "http://localhost:3000/api/audit-logs?userId=user-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 查询角色相关的操作
curl -X GET "http://localhost:3000/api/audit-logs?resource=Role" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 查询指定日期范围的日志
curl -X GET "http://localhost:3000/api/audit-logs?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "audit-log-uuid",
        "event": "role:update",
        "userId": "user-uuid",
        "user": {
          "id": "user-uuid",
          "userName": "admin",
          "email": "admin@example.com"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "resource": "Role",
        "resourceId": "role-uuid",
        "action": "UPDATE",
        "payload": {
          "before": { "name": "旧角色名" },
          "after": { "name": "新角色名" }
        },
        "result": "SUCCESS",
        "errorMsg": null,
        "createdAt": "2025-11-05T10:30:00.000Z"
      }
    ],
    "current": 1,
    "size": 20,
    "total": 150
  }
}
```

### 2. 获取单条审计日志详情

**接口**: `GET /api/audit-logs/:id`

**权限**: 仅管理员（ADMIN）

**请求示例**:

```bash
curl -X GET "http://localhost:3000/api/audit-logs/audit-log-uuid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 常见事件命名规范

建议使用以下格式命名事件：

- `{resource}:{action}` - 基本格式
- 示例：
  - `user:create` - 创建用户
  - `user:update` - 更新用户
  - `user:delete` - 删除用户
  - `role:create` - 创建角色
  - `role:update` - 更新角色
  - `role:delete` - 删除角色
  - `permission:grant` - 授予权限
  - `permission:revoke` - 撤销权限
  - `menu:create` - 创建菜单
  - `menu:update` - 更新菜单
  - `auth:login` - 用户登录
  - `auth:logout` - 用户登出
  - `auth:failed` - 认证失败
  - `system:startup` - 系统启动
  - `system:shutdown` - 系统关闭

## Swagger 文档

审计日志 API 已集成到 Swagger 文档中，访问：

```
http://localhost:3000/api-docs
```

在 Swagger UI 中：
1. 点击 "Authorize" 按钮
2. 输入 JWT Token
3. 找到 "审计日志" 标签
4. 测试 API

## 注意事项

1. **性能考虑**: 审计日志写入失败不会阻塞主业务流程，错误会记录到应用日志中
2. **权限控制**: 审计日志查询接口仅管理员可访问
3. **数据保留**: 建议定期归档或清理旧的审计日志
4. **敏感数据**: 不要在 payload 中记录密码等敏感信息
5. **索引优化**: 表已建立索引：event, userId, createdAt, (resource, resourceId)

## 扩展功能（建议）

未来可以考虑添加：

1. **自动归档**: 定期将旧日志移动到归档表
2. **告警通知**: 关键操作失败时发送通知
3. **日志导出**: 支持导出为 CSV/Excel 格式
4. **可视化统计**: 操作趋势图表、用户活跃度等
5. **日志回滚**: 基于审计日志实现操作回滚
