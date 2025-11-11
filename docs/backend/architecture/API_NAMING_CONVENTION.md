# API 命名规范设计文档

## 📋 概述

本项目采用 **camelCase（小驼峰）** 作为 API 的统一命名规范，通过 Prisma ORM 的 `@map()` 装饰器自动处理前后端与数据库之间的命名转换。

## 🎯 设计目标

1. **前端友好**：使用 JavaScript/TypeScript 标准的 camelCase 命名
2. **数据库规范**：保持 PostgreSQL 传统的 snake_case 命名
3. **零转换成本**：无需运行时转换，无性能损耗
4. **类型安全**：TypeScript 类型完全匹配，编译时检查

## 📊 命名转换流程

```
┌──────────────────────────────────────────────────────────────────┐
│                         完整数据流程                              │
└──────────────────────────────────────────────────────────────────┘

前端请求 (camelCase)
  ↓
  { firstName: "John", lastName: "Doe" }
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
NestJS DTO 接收 (camelCase)
  ↓
  CreateUserDto { firstName, lastName }
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
Prisma Client 转换 (自动)
  ↓
  { first_name: "John", last_name: "Doe" }  ← 编译时生成转换代码
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
PostgreSQL 存储 (snake_case)
  ↓
  INSERT INTO users (first_name, last_name) VALUES ('John', 'Doe')
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
Prisma Client 查询 (自动转换回 camelCase)
  ↓
  { firstName: "John", lastName: "Doe" }
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
NestJS 响应
  ↓
  { firstName: "John", lastName: "Doe" }
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
前端接收 (camelCase)
  ↓
  { firstName: "John", lastName: "Doe" }
```

## 🔧 技术实现

### 1. Prisma Schema 配置

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique

  // 字段映射：API 使用 camelCase，数据库使用 snake_case
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // 表名映射
  @@map("users")
}
```

**关键点**：
- `@map("column_name")`：字段级别映射
- `@@map("table_name")`：表级别映射
- Prisma 在生成 Client 时自动创建转换逻辑

### 2. DTO 定义

```typescript
// src/modules/users/dto/create-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '名字' })
  @IsOptional()
  @IsString()
  firstName?: string;  // ✅ camelCase

  @ApiProperty({ description: '姓氏' })
  @IsOptional()
  @IsString()
  lastName?: string;   // ✅ camelCase
}
```

### 3. Service 层使用

```typescript
// src/modules/users/users.service.ts

async create(createUserDto: CreateUserDto) {
  // Prisma 自动处理命名转换
  const user = await this.prisma.user.create({
    data: {
      firstName: createUserDto.firstName,  // API: firstName
      lastName: createUserDto.lastName,    // DB:  first_name
    },
  });

  return user;  // 返回的对象字段名自动是 camelCase
}
```

### 4. API 响应

```json
// GET /api/users/123
{
  "code": 0,
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "john",
    "firstName": "John",      // ✅ camelCase
    "lastName": "Doe",        // ✅ camelCase
    "isActive": true,         // ✅ camelCase
    "createdAt": "2025-01-15T10:00:00.000Z",  // ✅ camelCase
    "updatedAt": "2025-01-15T10:00:00.000Z"   // ✅ camelCase
  }
}
```

## ✅ 设计优势

### 1. 前端友好

**传统方案（需要转换）**：
```typescript
// ❌ 不推荐：前端需要手动转换
const response = await fetch('/api/users');
const data = await response.json();
// 数据是 snake_case，需要转换
const user = {
  firstName: data.first_name,  // 手动转换
  lastName: data.last_name,    // 手动转换
};
```

**我们的方案（无需转换）**：
```typescript
// ✅ 推荐：直接使用
const response = await fetch('/api/users');
const user = await response.json();
console.log(user.firstName);  // 直接使用 camelCase
console.log(user.lastName);   // 符合 JavaScript 规范
```

### 2. 零性能开销

**对比其他方案**：

| 方案 | 性能开销 | 说明 |
|------|---------|------|
| **Prisma @map()** | ✅ **零开销** | 编译时生成转换代码 |
| 全局拦截器转换 | ❌ 高 | 每次请求/响应都要遍历对象 |
| 前端手动转换 | ❌ 中 | 每次调用 API 都要转换 |
| 使用转换库（lodash） | ❌ 中 | 运行时深度遍历对象 |

**Prisma 生成的代码示例**：
```typescript
// node_modules/.prisma/client/index.d.ts
// Prisma 在编译时就生成好了类型和转换逻辑

export type User = {
  id: string;
  firstName: string | null;  // ✅ 类型已经是 camelCase
  lastName: string | null;
  createdAt: Date;
}
```

### 3. 类型安全

```typescript
// ✅ TypeScript 完全类型安全
const user = await prisma.user.create({
  data: {
    firstName: 'John',  // ✅ 自动补全
    // first_name: 'John',  // ❌ TypeScript 报错
  },
});

console.log(user.firstName);  // ✅ 类型推导正确
// console.log(user.first_name);  // ❌ TypeScript 报错
```

### 4. 维护简单

**添加新字段流程**：

```prisma
// 1. 只需在 Prisma schema 中添加一次
model User {
  phoneNumber String? @map("phone_number")  // 仅此一行配置
}
```

```bash
# 2. 生成 Prisma Client
pnpm prisma:generate
```

```typescript
// 3. 整个应用自动可用 camelCase
const user = await prisma.user.create({
  data: { phoneNumber: '13800138000' },  // ✅ 自动可用
});
```

## ❌ 不推荐的替代方案

### 方案 1：全局拦截器转换

```typescript
// ❌ 不推荐
@Injectable()
export class CaseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.transformKeys(data, 'camelCase'))  // 运行时转换
    );
  }

  private transformKeys(obj: any, targetCase: string): any {
    // 递归遍历所有属性转换... 性能开销大
  }
}
```

**问题**：
1. ❌ **性能损耗**：每个响应都要遍历所有字段
2. ❌ **复杂度高**：需要处理嵌套对象、数组、日期等特殊类型
3. ❌ **类型丢失**：运行时转换可能导致 TypeScript 类型不匹配
4. ❌ **难以维护**：转换逻辑复杂，容易出错

### 方案 2：前端手动转换

```typescript
// ❌ 不推荐
const response = await fetch('/api/users');
const data = await response.json();

// 每次调用都要写这些转换代码
const user = {
  firstName: data.first_name,
  lastName: data.last_name,
  createdAt: data.created_at,
  // ... 大量重复代码
};
```

**问题**：
1. ❌ **代码重复**：每个 API 调用都要写转换逻辑
2. ❌ **容易出错**：手动转换容易遗漏字段
3. ❌ **维护成本高**：添加字段需要更新所有转换代码

### 方案 3：API 使用 snake_case

```typescript
// ❌ 不推荐
export class CreateUserDto {
  first_name?: string;  // 不符合 JavaScript 规范
  last_name?: string;
}
```

**问题**：
1. ❌ **不符合规范**：违背 JavaScript/TypeScript 命名约定
2. ❌ **代码可读性差**：`user.first_name` vs `user.firstName`
3. ❌ **团队协作困难**：前端开发者不习惯 snake_case

## 📝 最佳实践

### 1. 统一使用 @map()

```prisma
// ✅ 推荐：所有多词字段都使用 @map()
model User {
  firstName String?  @map("first_name")
  lastName  String?  @map("last_name")
  isActive  Boolean  @map("is_active")
  createdAt DateTime @map("created_at")
  updatedAt DateTime @map("updated_at")
}

// ❌ 避免：混用不同命名风格
model User {
  firstName String?  // 数据库字段是 firstName？还是 first_name？
  last_name String?  // API 是 last_name？还是 lastName？
}
```

### 2. DTO 与 Prisma 模型保持一致

```typescript
// ✅ 推荐：DTO 字段名与 Prisma 模型一致
export class CreateUserDto {
  firstName?: string;  // 与 Prisma 模型的 firstName 一致
  lastName?: string;
}

// ❌ 避免：DTO 使用不同的命名
export class CreateUserDto {
  first_name?: string;  // 与 Prisma 不一致
}
```

### 3. API 文档使用 camelCase

```typescript
// ✅ 推荐：Swagger 文档也使用 camelCase
@ApiProperty({
  description: '名字',
  example: 'John',
})
firstName?: string;
```

## 🧪 示例对比

### 查询示例

```typescript
// 前端代码
const response = await axios.get('/api/users/123');
const user = response.data.data;

// ✅ 直接使用，符合 JavaScript 习惯
console.log(user.firstName);   // "John"
console.log(user.lastName);    // "Doe"
console.log(user.createdAt);   // "2025-01-15T10:00:00.000Z"
```

### 创建示例

```typescript
// 前端代码 - 发送请求
await axios.post('/api/users', {
  email: 'john@example.com',
  username: 'john',
  firstName: 'John',    // ✅ camelCase
  lastName: 'Doe',      // ✅ camelCase
});

// 后端代码 - 接收并存储
@Post()
async create(@Body() dto: CreateUserDto) {
  // Prisma 自动转换为 first_name, last_name 存入数据库
  return this.prisma.user.create({ data: dto });
}
```

### 更新示例

```typescript
// 前端代码
await axios.patch('/api/users/123', {
  firstName: 'Jane',  // ✅ camelCase
});

// 数据库实际执行
// UPDATE users SET first_name = 'Jane' WHERE id = '123'
// ↑ Prisma 自动转换为 snake_case
```

## 📚 相关资源

- [Prisma Schema 文档](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Prisma @map 映射](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#map)
- [JavaScript 命名规范](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Writing_style_guide/Code_style_guide/JavaScript#variable_naming)
- [TypeScript 编码指南](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## 🎯 总结

| 方面 | 说明 |
|------|------|
| **前端 API** | ✅ 统一使用 camelCase |
| **后端 DTO** | ✅ 统一使用 camelCase |
| **数据库** | ✅ 使用 snake_case（PostgreSQL 规范） |
| **转换方式** | ✅ Prisma `@map()` 自动转换 |
| **性能开销** | ✅ 零开销（编译时转换） |
| **类型安全** | ✅ 完全类型安全 |
| **维护成本** | ✅ 低（只需配置一次） |

**结论**：通过 Prisma 的 `@map()` 装饰器，我们实现了前后端使用 JavaScript 标准命名（camelCase），数据库使用 SQL 标准命名（snake_case），并且无需任何运行时转换，性能最优，维护最简单。

---

**文档版本**: 1.0.0
**最后更新**: 2025-10-16
**维护者**: NestBase Team
