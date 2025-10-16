# 📝 更新日志

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
