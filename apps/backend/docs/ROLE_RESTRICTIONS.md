# 角色管理限制说明

## 概述

为了保护系统的核心角色和数据完整性，角色管理 API 实施了以下限制：

1. **不允许通过 API 创建系统角色**
2. **系统角色不允许修改任何字段（包括禁用）**
3. **系统角色不允许删除**
4. **所有角色的 `code` 字段在创建后不可修改**

---

## 设计理由

### 为什么要保护系统角色？

系统角色（`isSystem: true`）是应用程序的核心角色，通常包括：
- `ADMIN` - 超级管理员
- `USER` - 普通用户
- `MODERATOR` - 版主（如果有）

这些角色具有以下特点：
1. **权限预设**：系统角色的权限是预先配置好的，修改可能导致权限混乱
2. **代码依赖**：应用代码中可能硬编码了对这些角色的检查（如 `@Roles('ADMIN')`）
3. **数据完整性**：删除系统角色会破坏用户-角色关联关系
4. **安全性**：禁用系统角色可能导致管理员无法登录

### 为什么 code 字段不可修改？

角色的 `code` 字段（如 `ADMIN`、`USER`）具有以下特点：
1. **唯一标识**：`code` 是角色在代码中的唯一标识符
2. **代码引用**：装饰器中使用了角色代码（`@Roles('ADMIN')`）
3. **一致性**：修改 code 可能导致已有权限配置失效
4. **可预测性**：保持 code 不变使系统行为更可预测

---

## 实现方式

### 1. 创建角色限制

#### DTO 层面
`isSystem` 字段已从 `CreateRoleDto` 中移除（注释），用户无法通过 API 设置此字段。

```typescript
// src/modules/roles/dto/create-role.dto.ts
export class CreateRoleDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // isSystem 字段不允许通过 API 设置，只能在数据库层面或系统初始化时设置
  // 系统角色只能通过数据库迁移或种子数据创建
  // @IsOptional()
  // @IsBoolean()
  // isSystem?: boolean;

  @IsOptional()
  @IsInt()
  status?: number;
}
```

#### Service 层面
即使用户尝试通过其他方式传入 `isSystem: true`，服务层也会拒绝并强制设为 `false`。

```typescript
// src/modules/roles/roles.service.ts - create 方法
async create(createDto: CreateRoleDto) {
  const { code, name, ...rest } = createDto;

  // 不允许通过 API 创建系统角色
  if ((rest as any).isSystem === true) {
    throw new BadRequestException({
      message: '不允许通过 API 创建系统角色',
      code: BusinessCode.FORBIDDEN,
    });
  }

  // ... 检查 code 和 name 是否已存在 ...

  // 确保 isSystem 字段不被设置
  return this.prisma.role.create({
    data: {
      code,
      name,
      ...rest,
      isSystem: false, // 强制设置为 false
    },
  });
}
```

### 2. 更新角色限制

#### 系统角色保护
在更新方法的最开始就检查角色是否为系统角色，如果是则直接拒绝任何修改。

```typescript
// src/modules/roles/roles.service.ts - update 方法
async update(id: string, updateDto: UpdateRoleDto) {
  const role = await this.findOne(id);

  // 系统角色不允许修改任何字段
  if (role.isSystem) {
    throw new BadRequestException({
      message: '系统角色不允许修改',
      code: BusinessCode.FORBIDDEN,
    });
  }

  // 从 DTO 中提取 code 字段,但不会用于更新
  // code 字段在创建后不可修改(即使传入也会被忽略)
  const { code, ...rest } = updateDto;

  // ... 检查 name 是否重复 ...

  return this.prisma.role.update({
    where: { id },
    data: rest, // code 不包含在更新数据中
  });
}
```

#### code 字段保护
所有角色（包括非系统角色）的 `code` 字段都不可修改。

- 从 `updateDto` 中解构出 `code` 字段
- 不将 `code` 包含在更新数据中
- 即使用户传入 `code`，也会被静默忽略（不报错）

### 3. 删除角色限制

系统角色不允许删除，已有的保护逻辑：

```typescript
// src/modules/roles/roles.service.ts - remove 方法
async remove(id: string) {
  const role = await this.findOne(id);

  // 不允许删除系统角色
  if (role.isSystem) {
    throw new BadRequestException({
      message: '不能删除系统角色',
      code: BusinessCode.FORBIDDEN,
    });
  }

  // 检查是否有用户关联此角色
  const userCount = await this.prisma.userRole.count({
    where: { roleId: id },
  });

  if (userCount > 0) {
    throw new BadRequestException({
      message: `该角色下还有 ${userCount} 个用户,无法删除`,
      code: BusinessCode.FORBIDDEN,
    });
  }

  await this.prisma.role.delete({ where: { id } });

  return { message: '角色删除成功' };
}
```

---

## API 行为说明

### 创建角色 - POST /api/roles

#### ✅ 成功案例
```bash
curl -X POST http://localhost:9423/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CUSTOM_ROLE",
    "name": "自定义角色",
    "description": "这是一个自定义角色",
    "status": 1
  }'
```

**响应**: ✅ 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CUSTOM_ROLE",
    "name": "自定义角色",
    "description": "这是一个自定义角色",
    "isSystem": false,  // 自动设为 false
    "status": 1,
    "createdAt": "2025-10-28T...",
    "updatedAt": "2025-10-28T..."
  }
}
```

#### ❌ 失败案例：尝试创建系统角色
```bash
curl -X POST http://localhost:9423/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUPER_ADMIN",
    "name": "超级管理员",
    "isSystem": true
  }'
```

**响应**: ❌ 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "不允许通过 API 创建系统角色",
  "code": 40003
}
```

### 更新角色 - PATCH /api/roles/:id

#### ✅ 成功案例：更新自定义角色
```bash
curl -X PATCH http://localhost:9423/api/roles/:id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新角色名称",
    "description": "更新后的描述",
    "status": 2
  }'
```

**响应**: ✅ 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CUSTOM_ROLE",  // code 保持不变
    "name": "新角色名称",
    "description": "更新后的描述",
    "isSystem": false,
    "status": 2,  // 可以修改状态（禁用）
    "createdAt": "2025-10-28T...",
    "updatedAt": "2025-10-28T..."
  }
}
```

#### ⚠️ 忽略案例：传入 code 字段
```bash
curl -X PATCH http://localhost:9423/api/roles/:id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "NEW_CODE",  // 会被忽略
    "name": "新角色名称"
  }'
```

**响应**: ✅ 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "CUSTOM_ROLE",  // code 未改变，保持原值
    "name": "新角色名称",
    "isSystem": false,
    "status": 1,
    "createdAt": "2025-10-28T...",
    "updatedAt": "2025-10-28T..."
  }
}
```

#### ❌ 失败案例：尝试更新系统角色
```bash
curl -X PATCH http://localhost:9423/api/roles/admin-role-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新管理员名称"
  }'
```

**响应**: ❌ 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "系统角色不允许修改",
  "code": 40003
}
```

#### ❌ 失败案例：尝试禁用系统角色
```bash
curl -X PATCH http://localhost:9423/api/roles/admin-role-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": 2  // 尝试禁用
  }'
```

**响应**: ❌ 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "系统角色不允许修改",
  "code": 40003
}
```

### 删除角色 - DELETE /api/roles/:id

#### ✅ 成功案例：删除自定义角色
```bash
curl -X DELETE http://localhost:9423/api/roles/:id \
  -H "Authorization: Bearer $TOKEN"
```

**响应**: ✅ 200 OK
```json
{
  "success": true,
  "data": {
    "message": "角色删除成功"
  }
}
```

#### ❌ 失败案例：尝试删除系统角色
```bash
curl -X DELETE http://localhost:9423/api/roles/admin-role-id \
  -H "Authorization: Bearer $TOKEN"
```

**响应**: ❌ 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "不能删除系统角色",
  "code": 40003
}
```

---

## 字段修改权限表

| 字段 | 创建时 | 更新时（自定义角色） | 更新时（系统角色） |
|------|--------|---------------------|-------------------|
| `code` | ✅ 可设置 | ❌ 不可修改（忽略） | ❌ 不可修改 |
| `name` | ✅ 可设置 | ✅ 可修改 | ❌ 不可修改 |
| `description` | ✅ 可设置 | ✅ 可修改 | ❌ 不可修改 |
| `home` | ✅ 可设置 | ✅ 可修改 | ❌ 不可修改 |
| `isSystem` | ❌ 强制为 false | ❌ 不可修改（忽略） | ❌ 不可修改 |
| `status` | ✅ 可设置 | ✅ 可修改（可禁用） | ❌ 不可修改（不可禁用） |

> **说明**: `home` 字段用于配置角色的默认首页路由，详见 [角色首页配置文档](./ROLE_HOME_PAGE.md)

---

## 如何创建系统角色？

系统角色只能通过以下方式创建，不能通过 API 创建：

### 方式 1: 数据库迁移

```sql
-- prisma/migrations/xxx_add_system_roles/migration.sql
INSERT INTO roles (id, code, name, description, is_system, status, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'ADMIN', '管理员', '系统管理员角色', true, 1, NOW(), NOW()),
  (gen_random_uuid(), 'USER', '普通用户', '系统普通用户角色', true, 1, NOW(), NOW());
```

### 方式 2: 种子数据

```typescript
// prisma/seed.ts
async function main() {
  // 创建系统角色
  const adminRole = await prisma.role.create({
    data: {
      code: 'ADMIN',
      name: '管理员',
      description: '系统管理员角色',
      isSystem: true,
      status: 1,
    },
  });

  const userRole = await prisma.role.create({
    data: {
      code: 'USER',
      name: '普通用户',
      description: '系统普通用户角色',
      isSystem: true,
      status: 1,
    },
  });
}
```

### 方式 3: 直接在数据库中操作

```sql
-- 使用 Prisma Studio 或直接 SQL
INSERT INTO roles (id, code, name, is_system, status, created_at, updated_at)
VALUES (gen_random_uuid(), 'MODERATOR', '版主', true, 1, NOW(), NOW());
```

---

## 前端处理建议

### 创建角色页面

```typescript
// 不需要 isSystem 字段的输入框
interface CreateRoleForm {
  code: string;        // 必填
  name: string;        // 必填
  description?: string;
  status?: number;     // 默认 1
}

const createRole = async (formData: CreateRoleForm) => {
  // 不需要传 isSystem 字段
  return await api.post('/api/roles', formData);
};
```

### 编辑角色页面

```typescript
interface EditRoleForm {
  // 不包含 code 字段（不可修改）
  name: string;
  description?: string;
  status?: number;
}

const updateRole = async (id: string, formData: EditRoleForm) => {
  // 不需要传 code 字段
  return await api.patch(`/api/roles/${id}`, formData);
};
```

### 角色列表页面

```typescript
// 根据 isSystem 显示不同的操作按钮
const RoleList = ({ roles }) => {
  return roles.map(role => (
    <div key={role.id}>
      <span>{role.name}</span>
      {role.isSystem ? (
        // 系统角色：只显示查看按钮
        <Button onClick={() => viewRole(role.id)}>查看</Button>
      ) : (
        // 自定义角色：显示编辑和删除按钮
        <>
          <Button onClick={() => editRole(role.id)}>编辑</Button>
          <Button onClick={() => deleteRole(role.id)}>删除</Button>
        </>
      )}
    </div>
  ));
};
```

### 状态切换开关

```typescript
// 根据 isSystem 禁用状态切换
const StatusSwitch = ({ role }) => {
  return (
    <Switch
      checked={role.status === 1}
      disabled={role.isSystem}  // 系统角色禁用开关
      onChange={(checked) => {
        if (!role.isSystem) {
          updateRoleStatus(role.id, checked ? 1 : 2);
        }
      }}
    />
  );
};
```

---

## 错误处理

### 业务错误码

所有角色限制相关的错误都使用 `BusinessCode.FORBIDDEN` (40003)：

```typescript
// @common/constants/business-codes.ts
export enum BusinessCode {
  // ...
  FORBIDDEN = 40003,  // 禁止操作
  // ...
}
```

### 错误响应格式

```typescript
{
  "success": false,
  "statusCode": 400,
  "message": "系统角色不允许修改",  // 或其他错误消息
  "code": 40003,
  "timestamp": "2025-10-28T..."
}
```

### 前端错误处理示例

```typescript
try {
  await updateRole(roleId, formData);
  message.success('角色更新成功');
} catch (error) {
  if (error.response?.data?.code === 40003) {
    // 权限相关错误
    message.error(error.response.data.message);
  } else {
    message.error('操作失败，请稍后重试');
  }
}
```

---

## 注意事项

### 1. 数据迁移注意事项

如果需要修改系统角色的 `code`，需要：
1. 更新数据库中的 `code` 字段
2. 更新代码中所有使用该 `code` 的地方（如 `@Roles('ADMIN')`）
3. 同步更新种子数据

### 2. 角色删除注意事项

删除角色前会检查是否有用户关联：
- 如果有用户使用该角色，删除会失败
- 需要先将用户的角色改为其他角色，才能删除

### 3. 状态字段说明

角色状态（`status`）的值：
- `1`: 启用
- `2`: 禁用

禁用角色后：
- 用户仍然拥有该角色
- 但该角色的权限将不再生效（需要在权限验证逻辑中处理）

### 4. isSystem 字段说明

`isSystem` 字段标记：
- `true`: 系统内置角色，不可修改、不可删除
- `false`: 自定义角色，可以修改和删除

---

## 测试用例

### 测试创建角色

```bash
# 1. 正常创建自定义角色
curl -X POST http://localhost:9423/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"EDITOR","name":"编辑者","status":1}'
# 期望: ✅ 成功，isSystem 自动为 false

# 2. 尝试创建系统角色
curl -X POST http://localhost:9423/api/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"SUPER","name":"超级用户","isSystem":true}'
# 期望: ❌ 400 错误 "不允许通过 API 创建系统角色"
```

### 测试更新角色

```bash
# 1. 更新自定义角色的名称
curl -X PATCH http://localhost:9423/api/roles/custom-role-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"新编辑者名称"}'
# 期望: ✅ 成功

# 2. 尝试修改自定义角色的 code
curl -X PATCH http://localhost:9423/api/roles/custom-role-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"NEW_CODE","name":"编辑者"}'
# 期望: ✅ 成功，但 code 保持不变

# 3. 禁用自定义角色
curl -X PATCH http://localhost:9423/api/roles/custom-role-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":2}'
# 期望: ✅ 成功

# 4. 尝试更新系统角色的名称
curl -X PATCH http://localhost:9423/api/roles/admin-role-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"新管理员"}'
# 期望: ❌ 400 错误 "系统角色不允许修改"

# 5. 尝试禁用系统角色
curl -X PATCH http://localhost:9423/api/roles/admin-role-id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":2}'
# 期望: ❌ 400 错误 "系统角色不允许修改"
```

### 测试删除角色

```bash
# 1. 删除自定义角色（无用户关联）
curl -X DELETE http://localhost:9423/api/roles/custom-role-id \
  -H "Authorization: Bearer $TOKEN"
# 期望: ✅ 成功

# 2. 尝试删除系统角色
curl -X DELETE http://localhost:9423/api/roles/admin-role-id \
  -H "Authorization: Bearer $TOKEN"
# 期望: ❌ 400 错误 "不能删除系统角色"

# 3. 删除有用户关联的自定义角色
curl -X DELETE http://localhost:9423/api/roles/role-with-users-id \
  -H "Authorization: Bearer $TOKEN"
# 期望: ❌ 400 错误 "该角色下还有 N 个用户,无法删除"
```

---

## 相关文件

### 核心文件
- `src/modules/roles/dto/create-role.dto.ts` - 创建角色 DTO
- `src/modules/roles/dto/update-role.dto.ts` - 更新角色 DTO
- `src/modules/roles/roles.service.ts` - 角色服务（包含所有业务逻辑）
- `src/modules/roles/roles.controller.ts` - 角色控制器

### 数据库文件
- `prisma/schema.prisma` - 角色模型定义
- `prisma/seed.ts` - 种子数据（包含系统角色创建）

### 常量定义
- `src/common/constants/business-codes.ts` - 业务错误码定义

---

**修改日期**: 2025-10-28
**版本**: v1.5.0
**影响范围**: 角色管理 API
**相关功能**: RBAC 权限系统
