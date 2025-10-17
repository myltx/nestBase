# 角色系统迁移文档

## 概述

NestBase 已从**硬编码枚举角色**迁移到**数据库维护的动态角色系统**。这允许管理员通过 API 创建、修改和管理自定义角色,而无需修改代码。

## 迁移内容

### 1. 数据模型变更

#### 之前 (枚举方式)
```prisma
enum Role {
  USER
  ADMIN
  MODERATOR
}

model User {
  roles Role[] @default([USER])
}
```

#### 之后 (数据库表方式)
```prisma
model Role {
  id          String     @id @default(uuid())
  code        String     @unique // 角色代码 (USER, ADMIN, MODERATOR)
  name        String     @unique // 角色名称 (用户, 管理员, 协调员)
  description String?    // 角色描述
  isSystem    Boolean    @default(false) // 是否系统内置角色
  isActive    Boolean    @default(true) // 是否启用
  userRoles   UserRole[]
  roleMenus   RoleMenu[]
}

model User {
  id        String     @id @default(uuid())
  userRoles UserRole[] // 用户角色关联
}

model UserRole {
  userId    String
  roleId    String
  user      User     @relation(fields: [userId], references: [id])
  role      Role     @relation(fields: [roleId], references: [id])
}
```

### 2. 代码变更

#### 装饰器使用变更
```typescript
// 之前
@Roles(Role.ADMIN, Role.MODERATOR)

// 之后
@Roles('ADMIN', 'MODERATOR')
```

#### JWT Token Payload 变更
```typescript
// 之前
{
  sub: userId,
  roles: [Role.ADMIN, Role.USER] // 枚举数组
}

// 之后
{
  sub: userId,
  roles: ['ADMIN', 'USER'] // 角色 code 字符串数组
}
```

#### 用户创建/更新 DTO 变更
```typescript
// 之前
class CreateUserDto {
  roles?: Role[];
}

// 之后
class CreateUserDto {
  roleIds?: string[]; // 角色 ID UUID 数组
}
```

### 3. API 变更

#### 角色管理 API (新增)
```
GET    /api/roles              # 获取所有角色列表
POST   /api/roles              # 创建新角色
GET    /api/roles/:id          # 获取角色详情
PATCH  /api/roles/:id          # 更新角色
DELETE /api/roles/:id          # 删除角色
POST   /api/roles/:id/menus    # 为角色分配菜单
GET    /api/roles/:id/menus    # 获取角色菜单列表
GET    /api/roles/:id/stats    # 获取角色统计信息
```

#### 用户管理 API 变更
```typescript
// 创建用户请求体
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "password123",
  "roleIds": ["uuid1", "uuid2"]  // 改为角色 ID 数组
}

// 用户响应
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "testuser",
  "roles": [  // 返回角色详细信息
    {
      "id": "uuid1",
      "code": "ADMIN",
      "name": "管理员"
    }
  ]
}
```

## 迁移步骤

### 1. 数据库迁移

```bash
# 1. 生成 Prisma Client
cd apps/backend
npx prisma generate

# 2. 推送 schema 变更到数据库
npx prisma db push

# 3. 运行种子脚本创建角色和用户数据
cd ../..
pnpm prisma:seed
```

### 2. 测试账号

种子脚本会创建以下测试账号:

- **管理员**: `Admin` / `ll666888` (拥有 ADMIN + MODERATOR 角色)
- **普通用户**: `test` / `123456A` (拥有 USER 角色)

### 3. 验证迁移

```bash
# 1. 编译检查
npx tsc --noEmit

# 2. 启动应用
pnpm dev

# 3. 测试登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Admin","password":"ll666888"}'
```

## 系统角色

系统内置三个角色,标记为 `isSystem: true`,不可删除:

| 代码 | 名称 | 描述 |
|------|------|------|
| USER | 普通用户 | 基础用户权限 |
| MODERATOR | 协调员 | 拥有部分管理权限 |
| ADMIN | 管理员 | 拥有系统所有权限 |

## 自定义角色

管理员可以通过 API 创建自定义角色:

```bash
POST /api/roles
{
  "code": "CUSTOM_ROLE",
  "name": "自定义角色",
  "description": "这是一个自定义角色",
  "isSystem": false,
  "isActive": true
}
```

## 角色权限控制

### 1. 路由级别

使用 `@Roles()` 装饰器保护路由:

```typescript
@Roles('ADMIN')
@Delete(':id')
async deleteUser(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

### 2. 多角色支持

`@Roles()` 装饰器支持 OR 逻辑:

```typescript
@Roles('ADMIN', 'MODERATOR')  // 拥有 ADMIN 或 MODERATOR 任一角色即可访问
```

### 3. 菜单权限

角色可以关联菜单,控制前端路由访问:

```typescript
// 获取用户的菜单
GET /api/menus/by-roles?roles=ADMIN,USER
```

## 注意事项

1. **系统角色不可删除**: `isSystem: true` 的角色不能通过 API 删除
2. **角色删除检查**: 删除角色前会检查是否有用户关联,如有则不允许删除
3. **角色 code 唯一**: 角色代码必须唯一,建议使用大写字母+下划线
4. **用户默认角色**: 通过注册接口创建的用户默认分配 USER 角色
5. **管理员创建**: 只能通过种子脚本或管理员 API 创建管理员用户

## 向后兼容性

此迁移**不向后兼容**。如果你的前端或其他服务依赖旧的角色枚举,需要同步更新:

- 将 `Role.ADMIN` 改为 `'ADMIN'`
- 更新用户创建/更新接口,使用 `roleIds` 而不是 `roles`
- 更新 JWT token 解析逻辑,`roles` 字段现在是字符串数组

## 文档更新

以下文档已更新:

- `README.md` - 更新角色管理章节
- `CLAUDE.md` - 更新架构说明
- `CHANGELOG.md` - 记录此次重大变更

## 支持

如有问题,请查看:
- Swagger API 文档: http://localhost:3000/api-docs
- Issue 追踪: https://github.com/anthropics/claude-code/issues
