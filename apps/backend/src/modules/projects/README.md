# 项目管理 API 使用文档

## 📋 概述

项目管理模块提供了完整的 CRUD 操作，用于维护你的项目展示列表。

**基础 URL**: `http://localhost:3001/api/projects`

**Swagger 文档**: http://localhost:3001/api-docs

---

## 🔐 权限说明

| 操作 | 是否需要认证 | 所需角色 |
|------|-------------|----------|
| 查询项目列表 | ❌ 公开 | - |
| 查询精选项目 | ❌ 公开 | - |
| 查询技术栈 | ❌ 公开 | - |
| 查询单个项目 | ❌ 公开 | - |
| 创建项目 | ✅ 需要 | ADMIN |
| 更新项目 | ✅ 需要 | ADMIN |
| 删除项目 | ✅ 需要 | ADMIN |
| 切换精选状态 | ✅ 需要 | ADMIN |

---

## 📚 API 端点

### 1. 创建项目 (仅管理员)

**POST** `/api/projects`

**请求头**:
```
Authorization: Bearer <your-jwt-token>
```

**请求体**:
```json
{
  "title": "极客博客系统",
  "description": "基于Nuxt.js + TypeScript + UnoCSS构建的现代化博客系统，支持Markdown写作、代码高亮、全文搜索等功能",
  "url": "https://mindlog.myltx.top",
  "tech": ["Nuxt.js", "TypeScript", "UnoCSS", "Nuxt Content"],
  "github": "https://github.com/mindLog",
  "demo": "https://mindlog.myltx.top",
  "featured": true
}
```

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "极客博客系统",
    "description": "基于Nuxt.js + TypeScript + UnoCSS构建的现代化博客系统...",
    "url": "https://mindlog.myltx.top",
    "tech": ["Nuxt.js", "TypeScript", "UnoCSS", "Nuxt Content"],
    "github": "https://github.com/mindLog",
    "demo": "https://mindlog.myltx.top",
    "featured": true,
    "createdAt": "2025-10-16T03:30:00.000Z",
    "updatedAt": "2025-10-16T03:30:00.000Z"
  }
}
```

**curl 示例**:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "极客博客系统",
    "description": "基于Nuxt.js + TypeScript + UnoCSS构建的现代化博客系统",
    "tech": ["Nuxt.js", "TypeScript"],
    "featured": true
  }'
```

---

### 2. 获取项目列表 (公开)

**GET** `/api/projects`

**查询参数**:
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10
- `search` (可选): 搜索关键词（搜索标题和描述）
- `featured` (可选): 是否只显示精选项目 (true/false)
- `tech` (可选): 按技术栈筛选
- `sortBy` (可选): 排序字段 (createdAt/updatedAt/title)，默认 createdAt
- `sortOrder` (可选): 排序方式 (asc/desc)，默认 desc

**请求示例**:
```
GET /api/projects?page=1&limit=10&featured=true&sortBy=createdAt&sortOrder=desc
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "极客博客系统",
        "description": "基于Nuxt.js + TypeScript + UnoCSS构建的现代化博客系统...",
        "url": "https://mindlog.myltx.top",
        "tech": ["Nuxt.js", "TypeScript", "UnoCSS", "Nuxt Content"],
        "github": "https://github.com/mindLog",
        "demo": "https://mindlog.myltx.top",
        "featured": true,
        "createdAt": "2025-10-16T03:30:00.000Z",
        "updatedAt": "2025-10-16T03:30:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**curl 示例**:
```bash
# 获取所有项目
curl http://localhost:3001/api/projects

# 只获取精选项目
curl http://localhost:3001/api/projects?featured=true

# 搜索包含"博客"的项目
curl http://localhost:3001/api/projects?search=博客

# 筛选使用TypeScript的项目
curl http://localhost:3001/api/projects?tech=TypeScript

# 分页查询
curl http://localhost:3001/api/projects?page=2&limit=5
```

---

### 3. 获取所有精选项目 (公开)

**GET** `/api/projects/featured`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "极客博客系统",
      "description": "...",
      "featured": true,
      ...
    }
  ]
}
```

**curl 示例**:
```bash
curl http://localhost:3001/api/projects/featured
```

---

### 4. 获取所有技术栈 (公开)

**GET** `/api/projects/tech-stack`

**响应** (200 OK):
```json
{
  "success": true,
  "data": [
    "Firebase",
    "MongoDB",
    "NestJS",
    "Next.js",
    "Nuxt Content",
    "Nuxt.js",
    "PostgreSQL",
    "Prisma",
    "React Native",
    "Redux",
    "Sass",
    "Stripe",
    "Supabase",
    "Tailwind CSS",
    "TypeScript",
    "UnoCSS",
    "Vite",
    "Vue 3"
  ]
}
```

**curl 示例**:
```bash
curl http://localhost:3001/api/projects/tech-stack
```

---

### 5. 获取单个项目 (公开)

**GET** `/api/projects/:id`

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "极客博客系统",
    ...
  }
}
```

**响应** (404 Not Found):
```json
{
  "success": false,
  "message": "项目 #invalid-id 不存在",
  "statusCode": 404
}
```

**curl 示例**:
```bash
curl http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000
```

---

### 6. 更新项目 (仅管理员)

**PATCH** `/api/projects/:id`

**请求头**:
```
Authorization: Bearer <your-jwt-token>
```

**请求体** (所有字段都是可选的):
```json
{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "featured": false
}
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "更新后的标题",
    "description": "更新后的描述",
    ...
  }
}
```

**curl 示例**:
```bash
curl -X PATCH http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "featured": false
  }'
```

---

### 7. 切换精选状态 (仅管理员)

**PATCH** `/api/projects/:id/toggle-featured`

**请求头**:
```
Authorization: Bearer <your-jwt-token>
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "featured": true,  // 自动切换
    ...
  }
}
```

**curl 示例**:
```bash
curl -X PATCH http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000/toggle-featured \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 8. 删除项目 (仅管理员)

**DELETE** `/api/projects/:id`

**请求头**:
```
Authorization: Bearer <your-jwt-token>
```

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "项目删除成功"
  }
}
```

**curl 示例**:
```bash
curl -X DELETE http://localhost:3001/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🧪 测试流程

### 1. 登录获取 Token

```bash
# 使用管理员账户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# 响应
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 2. 创建项目

```bash
# 复制上面的 token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 创建项目
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试项目",
    "description": "这是一个测试项目",
    "tech": ["React", "TypeScript"],
    "featured": true
  }'
```

### 3. 查询项目

```bash
# 查询所有项目（无需认证）
curl http://localhost:3001/api/projects

# 查询精选项目
curl http://localhost:3001/api/projects/featured
```

---

## 📊 数据模型

```typescript
interface Project {
  id: string;              // UUID
  title: string;           // 项目标题（必填）
  description: string;     // 项目描述（必填）
  url?: string;            // 项目 URL（可选）
  tech: string[];          // 技术栈数组（必填）
  github?: string;         // GitHub 仓库地址（可选）
  demo?: string;           // 在线演示地址（可选）
  featured: boolean;       // 是否精选（默认 false）
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

---

## 🔄 填充测试数据

```bash
# 方法 1: 使用种子脚本（推荐）
cd apps/backend
npx ts-node prisma/seed-projects.ts

# 方法 2: 手动创建（需要先登录获取 token）
# 参考上面的"创建项目" API
```

---

## 💡 使用建议

### 前端集成示例

```typescript
// 获取项目列表
async function getProjects(params?: {
  page?: number;
  limit?: number;
  search?: string;
  featured?: boolean;
  tech?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined)
  ).toString();

  const response = await fetch(
    `http://localhost:3001/api/projects?${queryString}`
  );
  const result = await response.json();
  return result.data;
}

// 获取精选项目
async function getFeaturedProjects() {
  const response = await fetch(
    'http://localhost:3001/api/projects/featured'
  );
  const result = await response.json();
  return result.data;
}

// 创建项目（需要 token）
async function createProject(data: CreateProjectDto, token: string) {
  const response = await fetch('http://localhost:3001/api/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  return result.data;
}
```

---

## 🐛 常见问题

### Q: 创建项目时返回 401 Unauthorized

A: 请确保：
1. 已登录并获取 JWT token
2. 请求头包含 `Authorization: Bearer <token>`
3. Token 未过期

### Q: 创建项目时返回 403 Forbidden

A: 只有 ADMIN 角色的用户才能创建、更新、删除项目。请确认当前用户角色。

### Q: URL 验证失败

A: 确保 URL 格式正确，必须包含协议（http:// 或 https://）

### Q: 如何筛选多个技术栈？

A: 目前单次查询只支持筛选一个技术栈。可以在前端获取数据后进行二次筛选，或者多次调用 API。

---

## 📚 相关文档

- [主文档](../../README.md)
- [Swagger API 文档](http://localhost:3001/api-docs)
- [认证模块文档](../../README.md#认证模块)

---

**最后更新**: 2025-10-16
