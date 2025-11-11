# 业务状态码实现详情

## 📊 所有模块状态码使用情况

本文档详细列出了所有模块中业务状态码的使用情况，方便开发和维护。

---

## 1. 认证模块 (AuthService)

**文件**: `src/modules/auth/auth.service.ts`

| 位置 | 状态码 | HTTP 状态 | 错误消息 | 触发条件 |
|------|--------|----------|----------|---------|
| Line 43-46 | `1106` | 409 | 邮箱已被注册 | 注册时邮箱已存在 |
| Line 55-58 | `1107` | 409 | 用户名已被使用 | 注册时用户名已存在 |
| Line 109-112 | `1101` | 401 | 用户名或密码错误 | 登录时用户不存在 |
| Line 119-122 | `1101` | 401 | 用户名或密码错误 | 登录时密码错误 |
| Line 127-130 | `1003` | 401 | 账户已被禁用 | 用户账户被禁用 |
| Line 184-187 | `1103` | 401 | 无效的 Token | Token 验证失败 |
| Line 192-195 | `1103` | 401 | Token 验证失败 | Token 解析异常 |

**代码示例**:
```typescript
// 邮箱已存在
throw new ConflictException({
  message: '邮箱已被注册',
  code: BusinessCode.EMAIL_ALREADY_EXISTS, // 1106
});

// 用户名或密码错误（统一错误消息，防止用户枚举）
throw new UnauthorizedException({
  message: '用户名或密码错误',
  code: BusinessCode.INVALID_CREDENTIALS, // 1101
});
```

---

## 2. 用户模块 (UsersService)

**文件**: `src/modules/users/users.service.ts`

| 位置 | 状态码 | HTTP 状态 | 错误消息 | 触发条件 |
|------|--------|----------|----------|---------|
| Line 34-37 | `1106` | 409 | 邮箱已被注册 | 创建用户时邮箱已存在 |
| Line 46-49 | `1107` | 409 | 用户名已被使用 | 创建用户时用户名已存在 |
| Line 91-94 | `1005` | 400 | 页码和每页数量必须大于 0 | 分页参数无效 |
| Line 170-173 | `1104` | 404 | 用户 ID xxx 不存在 | 查询用户时 ID 不存在 |
| Line 184-187 | `1104` | 404 | 用户 ID xxx 不存在 | 更新用户时 ID 不存在 |
| Line 242-245 | `1104` | 404 | 用户 ID xxx 不存在 | 删除用户时 ID 不存在 |

**代码示例**:
```typescript
// 用户不存在
throw new NotFoundException({
  message: `用户 ID ${id} 不存在`,
  code: BusinessCode.USER_NOT_FOUND, // 1104
});

// 分页参数验证
throw new BadRequestException({
  message: '页码和每页数量必须大于 0',
  code: BusinessCode.VALIDATION_ERROR, // 1005
});
```

---

## 3. 项目模块 (ProjectsService)

**文件**: `src/modules/projects/projects.service.ts`

| 位置 | 状态码 | HTTP 状态 | 错误消息 | 触发条件 |
|------|--------|----------|----------|---------|
| Line 33-36 | `1000` | 400 | 创建项目失败 | 项目创建数据库操作失败 |
| Line 130-133 | `1201` | 404 | 项目 #xxx 不存在 | 查询项目时 ID 不存在 |
| Line 154-157 | `1000` | 400 | 更新项目失败 | 项目更新数据库操作失败 |
| Line 175-178 | `1000` | 400 | 删除项目失败 | 项目删除数据库操作失败 |

**代码示例**:
```typescript
// 项目不存在
throw new NotFoundException({
  message: `项目 #${id} 不存在`,
  code: BusinessCode.RESOURCE_NOT_FOUND, // 1201
});

// 数据库操作失败
try {
  await this.prisma.project.create({ data: createProjectDto });
} catch (error) {
  throw new BadRequestException({
    message: '创建项目失败',
    code: BusinessCode.BAD_REQUEST, // 1000
  });
}
```

---

## 4. 全局异常处理

### TransformInterceptor (成功响应)

**文件**: `src/common/interceptors/transform.interceptor.ts`

```typescript
return next.handle().pipe(
  map((data) => ({
    code: BusinessCode.SUCCESS, // 0
    success: true,
    data: data,
    message: 'success',
    timestamp: new Date().toISOString(),
  })),
);
```

### HttpExceptionFilter (错误响应)

**文件**: `src/common/filters/http-exception.filter.ts`

```typescript
// 根据 HTTP 状态码映射业务状态码
let businessCode = HTTP_TO_BUSINESS_CODE[status] || BusinessCode.INTERNAL_SERVER_ERROR;

// 如果异常中包含自定义 code，使用它
if (responseObj.code !== undefined) {
  businessCode = responseObj.code;
}

response.status(status).json({
  code: businessCode,
  success: false,
  statusCode: status,
  message,
  errors,
  timestamp: new Date().toISOString(),
  path: request.url,
});
```

---

## 5. 业务状态码定义

**文件**: `src/common/constants/business-codes.ts`

### 成功状态
```typescript
SUCCESS = 0  // 操作成功
```

### 通用客户端错误 (10xx)
```typescript
BAD_REQUEST = 1000        // 请求参数错误
UNAUTHORIZED = 1001       // 未授权
FORBIDDEN = 1003          // 禁止访问
NOT_FOUND = 1004          // 资源不存在
VALIDATION_ERROR = 1005   // 数据验证失败
CONFLICT = 1009           // 资源冲突
```

### 认证相关错误 (11xx)
```typescript
INVALID_CREDENTIALS = 1101        // 用户名或密码错误
TOKEN_EXPIRED = 1102              // Token 已过期
TOKEN_INVALID = 1103              // Token 无效
USER_NOT_FOUND = 1104             // 用户不存在
USER_ALREADY_EXISTS = 1105        // 用户已存在
EMAIL_ALREADY_EXISTS = 1106       // 邮箱已被注册
USERNAME_ALREADY_EXISTS = 1107    // 用户名已被使用
CANNOT_REGISTER_ADMIN = 1108      // 无法注册管理员账户
```

### 资源相关错误 (12xx)
```typescript
RESOURCE_NOT_FOUND = 1201         // 资源不存在
RESOURCE_ALREADY_EXISTS = 1202    // 资源已存在
```

### 服务器错误 (2xxx)
```typescript
INTERNAL_SERVER_ERROR = 2000      // 服务器内部错误
DATABASE_ERROR = 2001             // 数据库错误
EXTERNAL_SERVICE_ERROR = 2002     // 外部服务错误
```

---

## 6. HTTP 状态码映射

```typescript
export const HTTP_TO_BUSINESS_CODE: Record<number, BusinessCode> = {
  200: BusinessCode.SUCCESS,           // 0
  201: BusinessCode.SUCCESS,           // 0
  400: BusinessCode.BAD_REQUEST,       // 1000
  401: BusinessCode.UNAUTHORIZED,      // 1001
  403: BusinessCode.FORBIDDEN,         // 1003
  404: BusinessCode.NOT_FOUND,         // 1004
  409: BusinessCode.CONFLICT,          // 1009
  500: BusinessCode.INTERNAL_SERVER_ERROR, // 2000
};
```

---

## 7. 使用统计

### 按模块统计

| 模块 | 异常处理数量 | 使用的业务状态码 |
|------|------------|----------------|
| **AuthService** | 7 | 1003, 1101, 1103, 1106, 1107 |
| **UsersService** | 6 | 1005, 1104, 1106, 1107 |
| **ProjectsService** | 4 | 1000, 1201 |
| **总计** | 17 | 8 个不同状态码 |

### 按状态码使用频率

| 状态码 | 使用次数 | 错误类型 | 使用场景 |
|--------|---------|---------|---------|
| `1106` | 2 | 邮箱已被注册 | Auth 注册、Users 创建 |
| `1107` | 2 | 用户名已被使用 | Auth 注册、Users 创建 |
| `1104` | 3 | 用户不存在 | Users 查询/更新/删除 |
| `1101` | 2 | 凭证错误 | Auth 登录 |
| `1103` | 2 | Token 无效 | Auth Token 验证 |
| `1000` | 3 | 请求错误 | Projects CRUD |
| `1005` | 1 | 验证错误 | Users 分页参数 |
| `1003` | 1 | 禁止访问 | Auth 账户禁用 |
| `1201` | 1 | 资源不存在 | Projects 查询 |

---

## 8. 前端处理示例

### TypeScript 类型定义

```typescript
enum BusinessCode {
  SUCCESS = 0,
  BAD_REQUEST = 1000,
  UNAUTHORIZED = 1001,
  FORBIDDEN = 1003,
  NOT_FOUND = 1004,
  VALIDATION_ERROR = 1005,
  CONFLICT = 1009,
  INVALID_CREDENTIALS = 1101,
  TOKEN_EXPIRED = 1102,
  TOKEN_INVALID = 1103,
  USER_NOT_FOUND = 1104,
  EMAIL_ALREADY_EXISTS = 1106,
  USERNAME_ALREADY_EXISTS = 1107,
  RESOURCE_NOT_FOUND = 1201,
}

interface ApiResponse<T = any> {
  code: number;
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  // 错误响应特有
  statusCode?: number;
  errors?: any;
  path?: string;
}
```

### 错误处理函数

```typescript
function handleApiError(response: ApiResponse): never {
  switch (response.code) {
    case BusinessCode.EMAIL_ALREADY_EXISTS:
      throw new Error('该邮箱已被注册');

    case BusinessCode.USERNAME_ALREADY_EXISTS:
      throw new Error('该用户名已被使用');

    case BusinessCode.INVALID_CREDENTIALS:
      throw new Error('用户名或密码错误');

    case BusinessCode.TOKEN_EXPIRED:
    case BusinessCode.TOKEN_INVALID:
      // 清除本地 Token，跳转登录页
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('登录已过期，请重新登录');

    case BusinessCode.USER_NOT_FOUND:
      throw new Error('用户不存在');

    case BusinessCode.RESOURCE_NOT_FOUND:
      throw new Error('请求的资源不存在');

    default:
      throw new Error(response.message || '操作失败');
  }
}
```

---

## 9. 测试验证

### 测试清单

- [x] 所有模块的异常都使用业务状态码
- [x] 成功响应包含 `code: 0`
- [x] 错误响应包含具体业务状态码
- [x] TypeScript 编译通过
- [x] 服务器正常运行
- [x] 热重载正常工作

### 验证命令

```bash
# 检查所有模块是否使用 BusinessCode
grep -r "BusinessCode" src/modules --include="*.service.ts"

# 输出:
# src/modules/auth/auth.service.ts (7 处)
# src/modules/users/users.service.ts (6 处)
# src/modules/projects/projects.service.ts (4 处)
```

---

## 10. 维护指南

### 添加新的业务状态码

1. 在 `src/common/constants/business-codes.ts` 中添加状态码：
```typescript
export enum BusinessCode {
  // 现有状态码...
  PAYMENT_FAILED = 1301,  // 新增
}

export const BUSINESS_CODE_MESSAGES: Record<BusinessCode, string> = {
  // 现有消息...
  [BusinessCode.PAYMENT_FAILED]: '支付失败',
};
```

2. 在业务代码中使用：
```typescript
throw new BadRequestException({
  message: '支付失败，请检查账户余额',
  code: BusinessCode.PAYMENT_FAILED,
});
```

### 最佳实践

1. **使用具体的状态码**：优先使用具体的业务状态码（如 `1106`），而不是通用状态码（如 `1009`）
2. **统一错误消息**：对于安全敏感的错误（如登录失败），使用统一的错误消息
3. **包含上下文**：错误消息中包含必要的上下文信息（如资源 ID）
4. **文档同步**：添加新状态码后，及时更新文档

---

**最后更新**: 2025-10-16
**版本**: 1.1.0
**涵盖模块**: Auth, Users, Projects
**总状态码数**: 17 个异常处理点
