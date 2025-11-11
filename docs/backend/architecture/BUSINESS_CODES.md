# 业务状态码说明

## 📋 概述

本项目使用业务状态码（Business Code）来标识 API 响应的业务状态，与 HTTP 状态码配合使用，提供更精确的错误识别和处理。

## 🔢 状态码分类

业务状态码采用以下分类规则：

- **0**: 成功
- **1xxx**: 客户端错误
- **2xxx**: 服务器错误
- **3xxx**: 业务逻辑错误（预留）

## 📊 业务状态码列表

### 成功状态

| 状态码 | 说明 | HTTP 状态码 |
|-------|------|-----------|
| 0 | 操作成功 | 200/201 |

### 客户端错误 (1xxx)

#### 通用错误 (10xx)

| 状态码 | 说明 | HTTP 状态码 |
|-------|------|-----------|
| 1000 | 请求参数错误 | 400 |
| 1001 | 未授权 | 401 |
| 1003 | 禁止访问 | 403 |
| 1004 | 资源不存在 | 404 |
| 1005 | 数据验证失败 | 400 |
| 1009 | 资源冲突 | 409 |

#### 认证相关错误 (11xx)

| 状态码 | 说明 | HTTP 状态码 |
|-------|------|-----------|
| 1101 | 用户名或密码错误 | 401 |
| 1102 | Token 已过期 | 401 |
| 1103 | Token 无效 | 401 |
| 1104 | 用户不存在 | 404 |
| 1105 | 用户已存在 | 409 |
| 1106 | 邮箱已被注册 | 409 |
| 1107 | 用户名已被使用 | 409 |
| 1108 | 无法注册管理员账户 | 403 |

#### 资源相关错误 (12xx)

| 状态码 | 说明 | HTTP 状态码 |
|-------|------|-----------|
| 1201 | 资源不存在 | 404 |
| 1202 | 资源已存在 | 409 |

### 服务器错误 (2xxx)

| 状态码 | 说明 | HTTP 状态码 |
|-------|------|-----------|
| 2000 | 服务器内部错误 | 500 |
| 2001 | 数据库错误 | 500 |
| 2002 | 外部服务错误 | 500 |

## 📝 响应格式

### 成功响应

```json
{
  "code": 0,
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "success",
  "timestamp": "2025-10-16T08:00:00.000Z"
}
```

### 错误响应

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

## 🔍 使用示例

### 1. 注册接口 - 邮箱已存在

**请求**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "newuser",
    "password": "Password123!"
  }'
```

**响应**:
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

### 2. 登录接口 - 凭证错误

**请求**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }'
```

**响应**:
```json
{
  "code": 1101,
  "success": false,
  "statusCode": 401,
  "message": "用户名或密码错误",
  "errors": null,
  "timestamp": "2025-10-16T08:00:00.000Z",
  "path": "/api/auth/login"
}
```

### 3. 成功登录

**请求**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**响应**:
```json
{
  "code": 0,
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "username": "admin",
      "role": "ADMIN"
    },
    "token": {
      "accessToken": "eyJhbGc...",
      "expiresIn": "7d"
    }
  },
  "message": "success",
  "timestamp": "2025-10-16T08:00:00.000Z"
}
```

## 🛠️ 前端处理建议

### TypeScript 类型定义

```typescript
// 响应类型定义
interface ApiResponse<T = any> {
  code: number;
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  // 错误响应特有字段
  statusCode?: number;
  errors?: any;
  path?: string;
}

// 业务状态码枚举
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
  CANNOT_REGISTER_ADMIN = 1108,
  // ...其他状态码
}
```

### 错误处理示例

```typescript
async function handleApiResponse<T>(response: ApiResponse<T>): Promise<T> {
  if (response.success && response.code === 0) {
    return response.data!;
  }

  // 根据业务状态码处理不同错误
  switch (response.code) {
    case BusinessCode.EMAIL_ALREADY_EXISTS:
      throw new Error('该邮箱已被注册，请使用其他邮箱');

    case BusinessCode.USERNAME_ALREADY_EXISTS:
      throw new Error('该用户名已被使用，请选择其他用户名');

    case BusinessCode.INVALID_CREDENTIALS:
      throw new Error('用户名或密码错误，请重试');

    case BusinessCode.TOKEN_EXPIRED:
      // 跳转到登录页
      router.push('/login');
      throw new Error('登录已过期，请重新登录');

    default:
      throw new Error(response.message || '操作失败');
  }
}

// 使用示例
try {
  const result = await handleApiResponse(await loginApi(credentials));
  console.log('登录成功:', result);
} catch (error) {
  console.error('登录失败:', error.message);
}
```

### Axios 拦截器示例

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;

    // 检查业务状态码
    if (data.code !== 0) {
      // 特殊处理 Token 过期
      if (data.code === BusinessCode.TOKEN_EXPIRED) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      return Promise.reject(new Error(data.message));
    }

    return response;
  },
  (error) => {
    if (error.response) {
      const data = error.response.data as ApiResponse;
      console.error('API Error:', {
        code: data.code,
        message: data.message,
        path: data.path,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 📚 扩展状态码

如需添加新的业务状态码：

1. 在 `src/common/constants/business-codes.ts` 中的 `BusinessCode` 枚举添加新状态码
2. 在 `BUSINESS_CODE_MESSAGES` 中添加对应的描述信息
3. 如果是常见的 HTTP 错误，更新 `HTTP_TO_BUSINESS_CODE` 映射
4. 在业务代码中抛出异常时使用自定义状态码

**示例**:

```typescript
// 添加新的业务状态码
export enum BusinessCode {
  // ...已有状态码
  PAYMENT_REQUIRED = 1301,
  PAYMENT_FAILED = 1302,
}

export const BUSINESS_CODE_MESSAGES: Record<BusinessCode, string> = {
  // ...已有消息
  [BusinessCode.PAYMENT_REQUIRED]: '需要付费',
  [BusinessCode.PAYMENT_FAILED]: '支付失败',
};

// 在业务代码中使用
throw new BadRequestException({
  message: '支付失败，请检查账户余额',
  code: BusinessCode.PAYMENT_FAILED,
});
```

## 🔐 安全建议

1. **不要在错误消息中暴露敏感信息**：如数据库错误、文件路径等
2. **统一认证错误消息**：如用户名或密码错误时，不要区分是用户名还是密码错误
3. **记录详细日志**：服务器端记录完整的错误堆栈，但客户端只返回简化信息
4. **限制错误尝试次数**：对于登录等敏感操作，考虑添加频率限制

---

**最后更新**: 2025-10-16
**版本**: 1.0.0
