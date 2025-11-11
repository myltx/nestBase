# 日志系统功能更新文档

**更新时间**: 2025-11-11
**版本**: v1.1.0
**状态**: ✅ 已完成（待数据库迁移）

---

## 📋 更新概览

本次更新为 NestBase 后端系统新增了完善的**日志管理系统**，包括访问日志、登录日志和错误日志三大模块，支持智能异常分类、实时统计分析和全面的日志查询功能。

### 核心功能

- ✅ **访问日志自动记录** - 拦截器自动记录所有成功的 HTTP 请求
- ✅ **登录日志追踪** - 记录成功/失败的登录尝试及原因
- ✅ **异常日志捕获** - 全局异常过滤器自动捕获并分类记录错误
- ✅ **智能错误分类** - 自动区分业务异常（WARN）和系统异常（ERROR）
- ✅ **统计分析接口** - 提供丰富的日志统计和分析功能
- ✅ **管理员专属** - 所有日志接口仅限 ADMIN 角色访问

---

## 🗄️ 数据库变更

### 新增数据模型

#### 1. AccessLog (访问日志)

```prisma
model AccessLog {
  id             String      @id @default(uuid())
  userId         String?     @map("user_id")           // 用户ID（可选）
  user           User?       @relation(...)             // 关联用户
  method         String                                 // HTTP方法
  path           String                                 // 请求路径
  query          String?                                // 查询参数
  statusCode     Int         @map("status_code")        // 响应状态码
  ip             String                                 // 客户端IP
  userAgent      String?     @map("user_agent") @db.Text // User Agent
  referer        String?                                // 来源页面
  responseTime   Int?        @map("response_time")      // 响应时间(ms)
  errorMessage   String?     @map("error_message") @db.Text // 错误信息
  errorStack     String?     @map("error_stack") @db.Text   // 错误堆栈（系统异常）
  errorLevel     ErrorLevel? @map("error_level")        // 错误级别
  exceptionType  String?     @map("exception_type")     // 异常类型
  createdAt      DateTime    @default(now()) @map("created_at")

  @@index([userId, path, statusCode, createdAt, ip, errorLevel])
  @@map("access_logs")
}
```

#### 2. LoginLog (登录日志)

```prisma
model LoginLog {
  id           String      @id @default(uuid())
  userId       String?     @map("user_id")       // 用户ID（失败时可能为null）
  user         User?       @relation(...)         // 关联用户
  email        String                             // 登录使用的邮箱/用户名
  status       LoginStatus                        // 登录状态
  ip           String                             // 客户端IP
  userAgent    String?     @map("user_agent") @db.Text // User Agent
  failReason   String?     @map("fail_reason")    // 失败原因
  createdAt    DateTime    @default(now()) @map("created_at")

  @@index([userId, email, status, createdAt, ip])
  @@map("login_logs")
}
```

### 新增枚举类型

```prisma
// 登录状态
enum LoginStatus {
  SUCCESS // 登录成功
  FAILED  // 登录失败
  LOGOUT  // 退出登录
}

// 错误日志级别
enum ErrorLevel {
  WARN  // 业务异常（参数错误、权限不足等）
  ERROR // 系统异常（数据库错误、第三方接口失败等）
}
```

---

## 🔧 核心功能实现

### 1. 访问日志拦截器 (`AccessLogInterceptor`)

**位置**: `src/common/interceptors/access-log.interceptor.ts`

**功能**:
- 自动拦截所有 HTTP 请求
- 记录成功请求的完整信息（2xx, 3xx）
- 计算请求响应时间
- 过滤系统端点（swagger、health checks）
- 异步记录，不阻塞响应

**自动记录字段**:
- 请求方法、路径、查询参数
- 响应状态码、响应时间
- 用户ID（如果已登录）
- 客户端IP、User Agent、Referer

### 2. 登录日志集成 (`AuthService`)

**位置**: `src/modules/auth/auth.service.ts`

**记录场景**:

| 场景 | 状态 | 记录内容 |
|------|------|---------|
| 用户名/密码错误 | FAILED | 登录邮箱、IP、User Agent、失败原因 |
| 账户被禁用 | FAILED | 用户ID、邮箱、IP、User Agent、失败原因 |
| 登录成功 | SUCCESS | 用户ID、邮箱、IP、User Agent |

**示例代码**:
```typescript
// 登录失败 - 用户不存在
await this.logsService.createLoginLog({
  email: userName,
  ip,
  userAgent,
  status: LoginStatus.FAILED,
  failReason: '用户名或密码错误',
});

// 登录成功
await this.logsService.createLoginLog({
  userId: user.id,
  email: user.email,
  ip,
  userAgent,
  status: LoginStatus.SUCCESS,
});
```

### 3. 全局异常过滤器 (`HttpExceptionFilter`)

**位置**: `src/common/filters/http-exception.filter.ts`

**核心特性**:

#### 智能异常分类
```typescript
// 根据 HTTP 状态码自动判断
if (status >= 400 && status < 500) {
  errorLevel = ErrorLevel.WARN;      // 业务异常
  exceptionType = '业务异常';
} else {
  errorLevel = ErrorLevel.ERROR;     // 系统异常
  exceptionType = '系统异常';
}
```

#### 分级日志输出
```typescript
// 业务异常 - 简要输出
if (errorLevel === ErrorLevel.ERROR) {
  this.logger.error('系统异常捕获:', {
    path, method, status, message,
    exception: exception.stack  // 完整堆栈
  });
} else {
  this.logger.warn('业务异常捕获:', {
    path, method, status, message
  });
}
```

#### 错误日志记录策略

| 异常类型 | HTTP状态码 | 日志级别 | 记录内容 | 说明 |
|---------|-----------|---------|---------|------|
| 业务异常 | 400-499 | WARN | 错误消息、请求信息 | 参数错误、权限不足、资源不存在 |
| 系统异常 | 500-599 | ERROR | 错误消息、完整堆栈、请求信息 | 数据库错误、第三方服务失败 |

### 4. 日志服务 (`LogsService`)

**位置**: `src/modules/logs/logs.service.ts`

**核心方法**:

```typescript
// 创建访问日志
async createAccessLog(data: {
  userId?: string;
  method: string;
  path: string;
  statusCode: number;
  ip: string;
  errorMessage?: string;
  errorStack?: string;      // 新增
  errorLevel?: ErrorLevel;  // 新增
  exceptionType?: string;   // 新增
  // ... 其他字段
})

// 创建登录日志
async createLoginLog(data: {
  userId?: string;
  email: string;
  status: LoginStatus;
  ip: string;
  userAgent?: string;
  failReason?: string;
})

// 查询访问日志（支持分页和多条件过滤）
async findAllAccessLogs(queryDto: QueryAccessLogDto)

// 查询登录日志（支持分页和多条件过滤）
async findAllLoginLogs(queryDto: QueryLoginLogDto)

// 访问日志统计
async getAccessLogStats(startDate?: string, endDate?: string)

// 登录日志统计
async getLoginLogStats(startDate?: string, endDate?: string)
```

---

## 🌐 API 接口

### 基础信息

- **Base URL**: `/api/logs`
- **认证**: JWT Bearer Token
- **权限**: 所有接口仅限 **ADMIN** 角色

### 访问日志接口

#### 1. 查询访问日志列表

```http
GET /api/logs/access
```

**Query Parameters**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| userId | string | 否 | 用户ID | `user-uuid-123` |
| method | string | 否 | HTTP方法 | `GET`, `POST` |
| path | string | 否 | 请求路径（支持模糊） | `/api/users` |
| statusCode | number | 否 | 响应状态码 | `200`, `404`, `500` |
| errorLevel | string | 否 | 错误级别 | `WARN`, `ERROR` |
| ip | string | 否 | 客户端IP | `192.168.1.1` |
| startDate | string | 否 | 开始时间 | `2025-01-01` |
| endDate | string | 否 | 结束时间 | `2025-12-31` |
| current | string | 否 | 当前页码 | `1` (默认) |
| size | string | 否 | 每页数量 | `10` (默认) |

**Response**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "log-uuid-123",
        "userId": "user-uuid-456",
        "user": {
          "id": "user-uuid-456",
          "userName": "john_doe",
          "nickName": "John",
          "email": "john@example.com"
        },
        "method": "POST",
        "path": "/api/auth/login",
        "query": "{}",
        "statusCode": 401,
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "referer": "https://example.com",
        "responseTime": null,
        "errorMessage": "用户名或密码错误",
        "errorStack": null,
        "errorLevel": "WARN",
        "exceptionType": "业务异常",
        "createdAt": "2025-11-11T08:30:00.000Z"
      }
    ],
    "current": 1,
    "size": 10,
    "total": 156,
    "totalPages": 16
  }
}
```

#### 2. 访问日志统计

```http
GET /api/logs/access/stats?startDate=2025-11-01&endDate=2025-11-30
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalCount": 15234,           // 总访问量
    "successCount": 14089,         // 成功请求数 (2xx, 3xx)
    "errorCount": 1145,            // 错误请求数 (4xx, 5xx)
    "uniqueUsers": 387,            // 独立用户数
    "uniqueIps": 521,              // 独立IP数
    "avgResponseTime": 142,        // 平均响应时间(ms)
    "topPaths": [                  // 访问最多的路径 TOP 10
      { "path": "/api/contents", "count": "3214" },
      { "path": "/api/auth/login", "count": "2156" }
    ],
    "statusCodeDistribution": [    // 状态码分布
      { "status_range": "2xx", "count": "12456" },
      { "status_range": "4xx", "count": "891" },
      { "status_range": "5xx", "count": "254" }
    ]
  }
}
```

### 登录日志接口

#### 3. 查询登录日志列表

```http
GET /api/logs/login
```

**Query Parameters**:

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| userId | string | 否 | 用户ID | `user-uuid-123` |
| email | string | 否 | 登录邮箱（模糊） | `john@` |
| status | LoginStatus | 否 | 登录状态 | `SUCCESS`, `FAILED`, `LOGOUT` |
| ip | string | 否 | 客户端IP | `192.168.1.1` |
| startDate | string | 否 | 开始时间 | `2025-01-01` |
| endDate | string | 否 | 结束时间 | `2025-12-31` |
| current | string | 否 | 当前页码 | `1` (默认) |
| size | string | 否 | 每页数量 | `10` (默认) |

**Response**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "log-uuid-789",
        "userId": "user-uuid-456",
        "user": {
          "id": "user-uuid-456",
          "userName": "john_doe",
          "nickName": "John",
          "email": "john@example.com"
        },
        "email": "john@example.com",
        "status": "FAILED",
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "failReason": "用户名或密码错误",
        "createdAt": "2025-11-11T08:25:30.000Z"
      }
    ],
    "current": 1,
    "size": 10,
    "total": 89,
    "totalPages": 9
  }
}
```

#### 4. 登录日志统计

```http
GET /api/logs/login/stats?startDate=2025-11-01&endDate=2025-11-30
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalCount": 2341,            // 总登录次数
    "successCount": 2156,          // 成功登录数
    "failedCount": 185,            // 失败登录数
    "logoutCount": 0,              // 退出登录数
    "uniqueUsers": 387,            // 独立用户数
    "uniqueIps": 521,              // 独立IP数
    "successRate": "92.10%",       // 登录成功率
    "topFailReasons": [            // 失败原因 TOP 5
      { "fail_reason": "用户名或密码错误", "count": "142" },
      { "fail_reason": "账户已被禁用", "count": "43" }
    ]
  }
}
```

---

## 📊 使用场景

### 1. 监控系统健康状况

```bash
# 查看系统异常日志
GET /api/logs/access?errorLevel=ERROR&current=1&size=20

# 获取最近一周的访问统计
GET /api/logs/access/stats?startDate=2025-11-04&endDate=2025-11-11
```

### 2. 安全审计

```bash
# 查看失败的登录尝试
GET /api/logs/login?status=FAILED&current=1&size=50

# 查看特定IP的访问记录
GET /api/logs/access?ip=192.168.1.100

# 查看特定用户的所有操作
GET /api/logs/access?userId=user-uuid-123
```

### 3. 性能分析

```bash
# 获取响应时间统计
GET /api/logs/access/stats

# 查看慢请求（配合响应时间字段）
GET /api/logs/access?current=1&size=100
# 手动分析响应时间超过1000ms的请求
```

### 4. 业务分析

```bash
# 查看最受欢迎的接口
GET /api/logs/access/stats
# 查看 topPaths 字段

# 分析登录行为
GET /api/logs/login/stats
```

---

## 🚀 部署步骤

### 前置条件

- ✅ 代码已更新完成
- ⚠️ 需要 Supabase 数据库在线
- ⚠️ 需要运行数据库迁移

### 部署流程

1. **确保 Supabase 数据库在线**

   登录 [Supabase Dashboard](https://app.supabase.com)，确认项目状态为 "Active"。

2. **重新生成 Prisma Client**

```bash
npx prisma generate
```

3. **应用数据库Schema变更**

```bash
# 开发环境（推荐）
npx prisma db push

# 或生产环境迁移
npx prisma migrate dev --name add_logging_system
```

4. **验证迁移成功**

```bash
npx prisma studio
# 检查是否新增了 access_logs 和 login_logs 表
```

5. **重启应用**

```bash
pnpm dev  # 开发环境
# 或
pnpm build && pnpm start:prod  # 生产环境
```

6. **功能测试**

```bash
# 测试登录日志
curl -X POST http://localhost:9423/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userName":"admin@example.com","password":"wrong_password"}'

# 查看登录日志（需要 admin token）
curl http://localhost:9423/api/logs/login \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## ⚠️ 注意事项

### 性能考虑

1. **异步日志记录**: 所有日志记录都是异步的，不会阻塞HTTP响应
2. **数据库索引**: 已为常用查询字段添加索引（userId, path, statusCode, createdAt, ip, errorLevel）
3. **日志轮转**: 建议定期清理旧日志数据（可通过定时任务实现）

### 安全考虑

1. **敏感信息**: 日志不会记录密码等敏感数据
2. **访问控制**: 所有日志接口仅限 ADMIN 角色访问
3. **堆栈信息**: 仅系统异常（ERROR级别）记录完整堆栈，避免泄露过多信息

### 存储优化

1. **errorStack** 字段仅在系统异常时记录，节省存储空间
2. **TEXT** 类型用于 userAgent、errorMessage、errorStack 等长文本字段
3. 建议定期归档或删除超过 90 天的日志数据

---

## 📈 数据增长预估

### 单日数据量估算

假设日均活跃用户 1000 人，每人平均 50 次请求：

- **访问日志**: 50,000 条/天 ≈ 150MB/天
- **登录日志**: 1,000 条/天 ≈ 3MB/天
- **错误日志**: 500 条/天 ≈ 1.5MB/天

### 存储建议

- **短期存储**（30天）: ≈ 4.6GB
- **中期存储**（90天）: ≈ 13.8GB
- **长期存储**（1年）: ≈ 56GB

建议：
- 热数据保留 30 天在主数据库
- 温数据（31-90天）可考虑归档到对象存储
- 冷数据（90天以上）压缩归档或删除

---

## 🔍 故障排查

### 问题1: 日志未记录

**可能原因**:
- LogsModule 未正确导入
- 拦截器未注册
- 异常过滤器未注册

**解决方法**:
```typescript
// 检查 app.module.ts
imports: [
  // ... 其他模块
  LogsModule,  // ✅ 确保已导入
],
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: AccessLogInterceptor,  // ✅ 访问日志拦截器
  },
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,   // ✅ 异常过滤器
  },
]
```

### 问题2: Prisma类型错误

**错误信息**:
```
Module '"@prisma/client"' has no exported member 'LoginStatus'
Module '"@prisma/client"' has no exported member 'ErrorLevel'
```

**解决方法**:
```bash
# 重新生成 Prisma Client
npx prisma generate
```

### 问题3: 数据库连接失败

**错误信息**:
```
Can't reach database server at `aws-1-ap-northeast-1.pooler.supabase.com:6543`
```

**解决方法**:
1. 检查 Supabase 项目状态（可能已暂停）
2. 检查网络连接
3. 验证 `.env` 文件中的 `DATABASE_URL` 和 `DIRECT_URL`

---

## 📚 相关文档

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [Supabase Documentation](https://supabase.com/docs)

---

## 🎯 后续优化计划

### 短期（1-2周）

- [ ] 添加日志自动清理定时任务
- [ ] 实现日志导出功能（CSV/JSON）
- [ ] 添加日志可视化看板

### 中期（1-2月）

- [ ] 实现日志全文搜索（ElasticSearch集成）
- [ ] 添加实时日志流（WebSocket）
- [ ] 实现日志告警功能（错误率过高自动通知）

### 长期（3-6月）

- [ ] 日志分析AI助手
- [ ] 异常自动诊断
- [ ] 性能瓶颈自动识别

---

## 📝 更新日志

### v1.1.0 (2025-11-11)

**新增功能**:
- ✅ 访问日志自动记录
- ✅ 登录日志追踪
- ✅ 异常日志智能分类
- ✅ 日志查询接口
- ✅ 日志统计分析

**数据库变更**:
- 新增 `AccessLog` 模型
- 新增 `LoginLog` 模型
- 新增 `LoginStatus` 枚举
- 新增 `ErrorLevel` 枚举

**API变更**:
- 新增 `GET /api/logs/access`
- 新增 `GET /api/logs/access/stats`
- 新增 `GET /api/logs/login`
- 新增 `GET /api/logs/login/stats`

---

**文档维护**: Claude Code
**最后更新**: 2025-11-11
**文档版本**: 1.0.0
