# 📝 更新日志

## [1.2.0] - 2025-10-17

### ✨ 新增功能

#### 1. **多角色支持（Multi-Role RBAC）**

- 用户现在可以拥有多个角色（角色数组）
- 从单角色 `role: Role` 升级为多角色 `roles: Role[]`
- 支持用户同时拥有 ADMIN、MODERATOR 等多个角色
- RolesGuard 更新为"OR"逻辑：用户拥有任一所需角色即可访问

**影响的文件**:
- `prisma/schema.prisma` - 更新 User 模型，`role` → `roles[]`
- `src/modules/auth/dto/register.dto.ts` - 无 roles 字段（安全限制）
- `src/modules/users/dto/create-user.dto.ts` - 支持 `roles` 数组
- `src/modules/users/dto/update-user.dto.ts` - 支持 `roles` 数组更新
- `src/modules/auth/auth.service.ts` - JWT payload 包含 `roles` 数组
- `src/modules/users/users.service.ts` - 所有查询支持多角色
- `src/common/guards/roles.guard.ts` - 多角色验证逻辑
- `src/modules/auth/strategies/jwt.strategy.ts` - JWT 验证支持多角色
- `prisma/seed.ts` - 创建多角色测试用户

**数据库变更**:
```prisma
// 之前
role Role @default(USER)

// 现在
roles Role[] @default([USER])
```

**API 响应变化**:
```json
// 之前
{
  "user": {
    "role": "ADMIN"
  }
}

// 现在
{
  "user": {
    "roles": ["ADMIN", "MODERATOR"]
  }
}
```

#### 2. **用户头像功能**

- 新增 `avatar` 字段，支持用户头像 URL
- 注册时可选填写头像地址
- 使用 `@IsUrl()` 验证头像 URL 格式
- 所有用户接口返回头像信息

**影响的文件**:
- `prisma/schema.prisma` - 添加 `avatar String?` 字段
- `src/modules/auth/dto/register.dto.ts` - 添加可选 avatar 字段
- `src/modules/users/dto/create-user.dto.ts` - 添加可选 avatar 字段
- `src/modules/users/dto/update-user.dto.ts` - 支持头像更新
- 所有查询响应包含 avatar 字段

**使用示例**:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user",
    "password": "pass123",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
  }'
```

#### 3. **密码字段自动排除**

- 所有用户查询接口自动排除 `password` 字段
- 使用 Prisma `select` 精确控制返回字段
- 统一的 `userSelect` 常量确保一致性
- 提升系统安全性

**实现方式**:
```typescript
// UsersService 中定义
private readonly userSelect = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  avatar: true,    // 新增
  roles: true,     // 多角色
  isActive: true,
  createdAt: true,
  updatedAt: true,
  // password 明确排除
};
```

### 🔧 改进

#### 1. **JWT Token 优化**

- JWT payload 现在包含 `roles` 数组而非单个 `role`
- 更新 `JwtPayload` 接口类型定义
- JwtStrategy 验证逻辑支持多角色
- Token 生成自动包含用户的所有角色

**JwtPayload 接口更新**:
```typescript
// 之前
export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
}

// 现在
export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  roles: Role[];
}
```

#### 2. **角色权限验证增强**

- RolesGuard 支持检查用户的角色数组
- 使用 `Array.includes()` 检查角色匹配
- 支持"OR"逻辑：拥有任一所需角色即可通过
- 错误消息包含所有所需角色列表

**验证逻辑**:
```typescript
const userRoles = user.roles || [];
const hasRole = requiredRoles.some((role) => userRoles.includes(role));
```

#### 3. **数据库种子脚本增强**

- 创建管理员账户同时拥有 ADMIN 和 MODERATOR 角色
- 所有测试用户包含头像 URL
- 使用 DiceBear API 生成个性化头像
- 先清空用户数据再创建，避免冲突

**测试账户**:
| 角色               | 用户名    | 密码         | 角色数组                  |
| ------------------ | --------- | ------------ | ------------------------- |
| 管理员+协调员      | admin     | admin123     | `[ADMIN, MODERATOR]`      |
| 普通用户           | testuser  | user123      | `[USER]`                  |
| 协调员             | moderator | moderator123 | `[MODERATOR]`             |

### 📚 文档更新

#### 更新的文档

1. **README.md**
   - 更新数据库模型说明（roles 数组 + avatar）
   - 更新测试账户表格，显示多角色
   - 更新注册示例，添加 avatar 字段
   - 更新登录响应示例，显示 roles 数组
   - 添加多角色支持说明
   - 添加密码保护说明

2. **CHANGELOG.md**
   - 添加 v1.2.0 版本更新日志
   - 详细记录所有变更内容
   - 提供迁移指南

### 🛠️ 技术变更

#### 数据库迁移

**破坏性变更** - 需要数据库迁移：

```bash
# 推送 schema 变更（开发环境）
npx prisma db push --accept-data-loss

# 重新生成 Prisma Client
npx prisma generate

# 重新填充测试数据
npx prisma db seed
```

**注意**：`role` → `roles[]` 的变更会导致现有数据丢失，请在生产环境谨慎操作。

#### TypeScript 类型更新

所有涉及角色的类型定义已更新：

```typescript
// DTO
roles?: Role[];  // 而非 role?: Role

// Service 返回
user: {
  roles: Role[];  // 而非 role: Role
}
```

### 📊 API 变更

#### 修改的端点响应格式

**POST /api/auth/register**

现在支持 `avatar` 可选字段：
```json
{
  "email": "user@example.com",
  "username": "user",
  "password": "pass123",
  "firstName": "Test",
  "lastName": "User",
  "avatar": "https://avatar.url"  // 新增
}
```

**POST /api/auth/login**

响应中 `role` 改为 `roles` 数组：
```json
{
  "data": {
    "user": {
      "roles": ["ADMIN", "MODERATOR"],  // 之前是 "role": "ADMIN"
      "avatar": "https://..."            // 新增
    }
  }
}
```

**GET /api/users**

- 返回用户列表包含 `roles` 数组和 `avatar`
- 所有响应自动排除 `password` 字段
- 支持按角色筛选：`?role=ADMIN`

**PATCH /api/users/:id**

支持更新用户的多个角色：
```json
{
  "roles": ["USER", "MODERATOR"],  // 可设置多个角色
  "avatar": "https://new-avatar.url"
}
```

### 🧪 测试建议

#### 需要测试的场景

1. **多角色功能**
   - ✅ 创建拥有多个角色的用户
   - ✅ 更新用户角色数组
   - ✅ 验证多角色用户可以访问相应接口
   - ✅ 验证 RolesGuard 的"OR"逻辑

2. **用户头像**
   - ✅ 注册时设置头像
   - ✅ 更新用户头像
   - ✅ 验证头像 URL 格式验证
   - ✅ 所有查询接口返回头像

3. **密码保护**
   - ✅ 所有用户查询接口不返回 password
   - ✅ 登录接口不返回 password
   - ✅ 注册接口不返回 password
   - ✅ 更新接口不返回 password

4. **向后兼容性**
   - ⚠️ 前端需要更新响应处理（`role` → `roles`）
   - ⚠️ JWT Token 解析需要更新

### 📦 部署注意事项

#### 迁移步骤

1. **备份数据库**（重要！）
   ```bash
   # 备份现有用户数据
   npx prisma db seed  # 或手动导出数据
   ```

2. **更新数据库 Schema**
   ```bash
   cd apps/backend
   npx prisma db push --accept-data-loss  # 开发环境
   # 或
   npx prisma migrate deploy  # 生产环境
   ```

3. **重新生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **重新填充数据**
   ```bash
   npx prisma db seed
   ```

5. **重启应用**
   ```bash
   pnpm dev  # 开发环境
   # 或
   pnpm start:prod  # 生产环境
   ```

#### 前端同步更新

**必须更新的前端代码**：

1. **类型定义**
   ```typescript
   // 之前
   interface User {
     role: string;
   }

   // 现在
   interface User {
     roles: string[];
     avatar?: string;
   }
   ```

2. **权限检查逻辑**
   ```typescript
   // 之前
   if (user.role === 'ADMIN') { ... }

   // 现在
   if (user.roles.includes('ADMIN')) { ... }
   ```

3. **头像显示**
   ```tsx
   <Avatar src={user.avatar || defaultAvatar} />
   ```

### ⚠️ 破坏性变更

1. **数据库 Schema 变更**
   - `role` 字段改为 `roles` 数组
   - 需要运行迁移并重新填充数据
   - 现有用户数据会丢失（如使用 `db push --accept-data-loss`）

2. **API 响应格式变更**
   - 所有用户相关响应中 `role` 改为 `roles`
   - 新增 `avatar` 字段
   - 前端必须同步更新

3. **JWT Token 格式变更**
   - Token payload 包含 `roles` 数组而非 `role`
   - 旧 Token 在新系统中无效
   - 用户需要重新登录

### 🔮 未来计划

1. **角色管理功能**
   - 添加角色管理后台界面
   - 支持动态角色分配
   - 角色权限矩阵可视化

2. **头像上传**
   - 支持本地头像上传
   - 图片压缩和格式转换
   - CDN 集成

3. **权限细化**
   - 支持基于资源的权限控制
   - 添加更细粒度的权限项
   - 权限继承机制

### 📝 相关文档

- [API 文档](README.md#api-文档)
- [数据库模型](README.md#数据库模型)
- [认证与授权](README.md#认证与授权)
- [业务状态码](apps/backend/BUSINESS_CODES.md)

---

## [1.1.1] - 2025-10-16

### 📚 文档增强

#### 新增：API 命名规范章节

在 README.md 中新增了详细的 **API 命名规范** 说明：

**内容包括**：
- 📋 命名转换流程图解
- 🔧 Prisma `@map()` 实现方式说明
- ✅ 设计决策分析（为什么使用 camelCase）
- ❌ 不推荐方案对比（全局拦截器转换的劣势）
- 📝 添加新字段的完整示例

**核心要点**：
- 前端和后端 API 统一使用 **camelCase**（如 `firstName`, `createdAt`）
- 数据库使用 **snake_case**（如 `first_name`, `created_at`）
- Prisma 通过 `@map()` 装饰器自动处理转换
- **零性能开销**：转换在编译时完成，无运行时开销
- **类型安全**：TypeScript 类型完全匹配

**为什么不需要额外的拦截器**：
1. ✅ Prisma 已经提供了最佳解决方案
2. ✅ 性能最优：无运行时转换开销
3. ✅ 维护简单：只需在 schema 中配置一次
4. ✅ 类型安全：自动生成正确的 TypeScript 类型

这样的设计确保了：
- 前端开发者可以使用标准的 JavaScript 命名规范
- 数据库保持 PostgreSQL 的 snake_case 传统
- 中间无需任何手动转换或额外配置

---

## [1.1.0] - 2025-10-16

### ✨ 新增功能

#### 1. **业务状态码系统**

- 添加了完整的业务状态码（Business Code）体系
- 所有 API 响应现在包含 `code` 字段
- 支持更精确的错误识别和前端处理
- 状态码分类：
  - `0`: 成功
  - `1xxx`: 客户端错误
  - `2xxx`: 服务器错误

**影响的文件**:
- `src/common/constants/business-codes.ts` (新增)
- `src/common/interceptors/transform.interceptor.ts` (更新)
- `src/common/filters/http-exception.filter.ts` (更新)
- `src/modules/auth/auth.service.ts` (更新 - 7 处异常)
- `src/modules/users/users.service.ts` (更新 - 6 处异常)
- `src/modules/projects/projects.service.ts` (更新 - 4 处异常)

**响应格式变化**:

之前:
```json
{
  "success": true,
  "data": {...},
  "message": "success",
  "timestamp": "..."
}
```

现在:
```json
{
  "code": 0,
  "success": true,
  "data": {...},
  "message": "success",
  "timestamp": "..."
}
```

#### 2. **注册安全增强**

- 禁止通过注册接口创建管理员账户
- 注册接口仅允许创建普通用户（USER 角色）
- 添加了详细的业务状态码用于注册错误
  - `1106`: 邮箱已被注册
  - `1107`: 用户名已被使用
  - `1108`: 无法注册管理员账户

**影响的文件**:
- `src/modules/auth/auth.service.ts` (更新)

**安全措施**:
- RegisterDTO 不包含 `role` 字段
- Service 层明确不接受 role 参数
- 使用 Prisma schema 默认值 `USER`
- 添加了详细的注释说明

### 🔧 改进

#### 1. **错误处理增强**

- 所有认证相关错误现在返回具体的业务状态码
- 错误消息更加友好和具体
- 支持自定义业务状态码的异常处理

**示例**:
```typescript
throw new ConflictException({
  message: '邮箱已被注册',
  code: BusinessCode.EMAIL_ALREADY_EXISTS,
});
```

#### 2. **Bearer Token 验证确认**

- 确认支持标准的 `Authorization: Bearer ${token}` 格式
- JwtStrategy 使用 `ExtractJwt.fromAuthHeaderAsBearerToken()`
- 与前端标准请求格式完全兼容

**前端使用示例**:
```javascript
// axios
axios.get('/api/auth/profile', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// fetch
fetch('/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 📚 文档更新

#### 新增文档

1. **BUSINESS_CODES.md**
   - 完整的业务状态码列表
   - 状态码分类说明
   - 使用示例
   - 前端处理建议
   - TypeScript 类型定义
   - Axios 拦截器示例

#### 更新文档

1. **README.md**
   - 更新响应格式说明，添加 `code` 字段
   - 添加业务状态码章节
   - 添加用户注册限制说明
   - 添加 Bearer Token 前端示例
   - 更新所有 API 响应示例

2. **示例响应更新**
   - 所有成功响应示例添加 `code: 0`
   - 所有错误响应示例添加具体业务状态码

### 🔒 安全性

#### 增强的安全措施

1. **注册权限控制**
   - 防止权限提升攻击
   - 管理员账户创建途径受限
   - 代码层面双重保护

2. **错误信息规范**
   - 统一认证错误消息（不泄露具体错误）
   - 登录失败统一返回"用户名或密码错误"
   - 避免用户枚举攻击

### 🛠️ 技术变更

#### 依赖更新

无新增依赖，仅使用现有依赖增强功能

#### 破坏性变更

⚠️ **响应格式变更** - 所有 API 响应现在包含 `code` 字段

**影响范围**: 所有前端调用都需要更新响应处理逻辑

**迁移指南**:

1. 更新响应类型定义：
```typescript
interface ApiResponse<T> {
  code: number;      // 新增
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
}
```

2. 更新错误处理：
```typescript
if (response.code !== 0) {
  // 处理错误
  switch (response.code) {
    case 1106:
      // 邮箱已存在
      break;
    // ...
  }
}
```

3. 可选：使用拦截器统一处理
```typescript
api.interceptors.response.use(
  (response) => {
    if (response.data.code !== 0) {
      return Promise.reject(new Error(response.data.message));
    }
    return response;
  }
);
```

### 📊 API 变更

#### 修改的端点

**POST /api/auth/register**

之前响应:
```json
{
  "success": true,
  "data": { "user": {...}, "token": {...} },
  "message": "success"
}
```

现在响应:
```json
{
  "code": 0,
  "success": true,
  "data": { "user": {...}, "token": {...} },
  "message": "success"
}
```

错误响应（邮箱已存在）:
```json
{
  "code": 1106,
  "success": false,
  "statusCode": 409,
  "message": "邮箱已被注册",
  "errors": null,
  "timestamp": "2025-10-16T08:00:00.000Z",
  "path": "/api/auth/register"
}
```

**POST /api/auth/login**

登录成功响应添加 `code: 0`

登录失败响应:
```json
{
  "code": 1101,
  "success": false,
  "statusCode": 401,
  "message": "用户名或密码错误"
}
```

### 🧪 测试建议

#### 需要测试的场景

1. **注册功能**
   - ✅ 正常注册普通用户
   - ✅ 邮箱重复注册（应返回 code: 1106）
   - ✅ 用户名重复注册（应返回 code: 1107）
   - ✅ 验证无法设置 role 为 ADMIN

2. **登录功能**
   - ✅ 正确凭证登录（返回 code: 0）
   - ✅ 错误密码登录（返回 code: 1101）
   - ✅ 不存在的用户登录（返回 code: 1101）

3. **Bearer Token 认证**
   - ✅ 正确的 Token 格式 `Bearer ${token}`
   - ✅ 访问受保护的接口
   - ✅ 验证 Token 过期处理

4. **响应格式**
   - ✅ 所有成功响应包含 `code: 0`
   - ✅ 所有错误响应包含具体业务状态码
   - ✅ OpenAPI JSON 端点不受影响（使用 @SkipTransform）

### 📦 部署注意事项

1. **前端同步部署**
   - 后端更新后，前端必须同步更新响应处理逻辑
   - 建议使用版本协商或渐进式更新

2. **数据库迁移**
   - 无需数据库迁移
   - 现有数据不受影响

3. **向后兼容**
   - ⚠️ 响应格式变更不向后兼容
   - 建议前后端同时发布

### 🔮 未来计划

1. **状态码扩展**
   - 添加更多业务场景的状态码
   - 支持国际化错误消息

2. **安全增强**
   - 添加登录频率限制
   - 添加账户锁定机制

3. **监控和日志**
   - 添加状态码统计
   - 错误追踪优化

### 📝 相关文档

- [业务状态码完整列表](apps/backend/BUSINESS_CODES.md)
- [API 文档](README.md#api-文档)
- [认证与授权](README.md#认证与授权)

---

## [1.0.0] - 2025-10-15

### ✨ 初始版本

- 基于 NestJS 10.x 的后端框架
- Supabase PostgreSQL + Prisma ORM 集成
- JWT 认证系统
- RBAC 角色权限控制
- Swagger/OpenAPI 文档
- Monorepo 架构
- 项目管理模块
- OpenAPI JSON 导出功能

---

**更新日期**: 2025-10-16
**版本**: 1.1.0
