# 内容管理系统 (CMS) 接口使用指南

> **创建日期**: 2025-11-07
> **版本**: v1.0.0
> **适用范围**: 前端开发人员、API 使用者

---

## 📋 目录

- [快速开始](#快速开始)
- [认证说明](#认证说明)
- [完整使用流程](#完整使用流程)
- [分类管理 API](#分类管理-api)
- [标签管理 API](#标签管理-api)
- [内容管理 API](#内容管理-api)
- [实战案例](#实战案例)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 基础信息

- **API 基础路径**: `http://localhost:9423/api`
- **Swagger 文档**: `http://localhost:9423/api-docs`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 统一响应结构

所有接口返回格式统一：

```typescript
// 成功响应
{
  "success": true,
  "data": { ... }  // 实际数据
}

// 错误响应
{
  "success": false,
  "message": "错误描述",
  "code": "BUSINESS_CODE",
  "statusCode": 400,
  "timestamp": "2025-11-07T10:30:00.000Z"
}
```

---

## 🔐 认证说明

### 权限级别

| 权限 | 说明 | 适用操作 |
|------|------|---------|
| **Public** | 无需登录 | 查询内容、分类、标签 |
| **ADMIN** | 管理员 | 所有操作 |
| **MODERATOR** | 协管员 | 创建/编辑内容、发布内容 |

### 获取 Token

```bash
# 1. 登录获取 Token
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

# 响应
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 使用 Token

在需要认证的接口中，添加 Authorization Header：

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📖 完整使用流程

### 典型工作流程

```
1. 创建分类 (Categories)
   ↓
2. 创建标签 (Tags)
   ↓
3. 创建内容草稿 (Contents - DRAFT)
   ↓
4. 编辑内容
   ↓
5. 发布内容 (PUBLISHED)
   ↓
6. 前端展示 (Public 访问)
```

### 数据关系图

```
Category (分类)
    ↓ 1:N
Content (内容) ← N:N → Tag (标签)
    ↓ N:1           ↓
  User (作者)    ContentTag (关联表)
```

---

## 📁 分类管理 API

### 1. 创建分类

**端点**: `POST /api/categories`
**权限**: ADMIN
**用途**: 创建新的分类（支持层级分类）

```bash
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "技术文章",
  "slug": "tech-articles",
  "description": "技术相关的文章分类",
  "parentId": null,  // 可选，父分类ID
  "order": 0         // 可选，排序值
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "cat-uuid-123",
    "name": "技术文章",
    "slug": "tech-articles",
    "description": "技术相关的文章分类",
    "parentId": null,
    "order": 0,
    "status": 1,
    "parent": null,
    "children": [],
    "_count": {
      "children": 0,
      "contents": 0
    },
    "createdAt": "2025-11-07T10:00:00.000Z",
    "updatedAt": "2025-11-07T10:00:00.000Z"
  }
}
```

### 2. 查询所有分类（树形结构）

**端点**: `GET /api/categories`
**权限**: Public
**用途**: 获取树形结构的分类列表

```bash
GET /api/categories
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-uuid-1",
      "name": "技术",
      "slug": "tech",
      "children": [
        {
          "id": "cat-uuid-2",
          "name": "前端开发",
          "slug": "frontend",
          "children": []
        },
        {
          "id": "cat-uuid-3",
          "name": "后端开发",
          "slug": "backend",
          "children": []
        }
      ]
    }
  ]
}
```

### 3. 查询所有分类（扁平列表）

**端点**: `GET /api/categories/flat`
**权限**: Public
**用途**: 获取扁平列表的所有分类

```bash
GET /api/categories/flat
```

### 4. 根据 slug 查询分类

**端点**: `GET /api/categories/slug/:slug`
**权限**: Public
**用途**: 通过 URL 友好的 slug 查询分类

```bash
GET /api/categories/slug/tech-articles
```

### 5. 更新分类

**端点**: `PATCH /api/categories/:id`
**权限**: ADMIN

```bash
PATCH /api/categories/cat-uuid-123
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "技术博客",
  "description": "更新后的描述"
}
```

### 6. 删除分类

**端点**: `DELETE /api/categories/:id`
**权限**: ADMIN
**注意**:
- 有子分类时无法删除
- 有关联内容时无法删除

```bash
DELETE /api/categories/cat-uuid-123
Authorization: Bearer {token}
```

---

## 🏷️ 标签管理 API

### 1. 创建标签

**端点**: `POST /api/tags`
**权限**: ADMIN
**用途**: 创建新标签

```bash
POST /api/tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "NestJS",
  "slug": "nestjs"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "tag-uuid-123",
    "name": "NestJS",
    "slug": "nestjs",
    "_count": {
      "contents": 0
    },
    "createdAt": "2025-11-07T10:00:00.000Z",
    "updatedAt": "2025-11-07T10:00:00.000Z"
  }
}
```

### 2. 批量创建标签

**端点**: `POST /api/tags/batch`
**权限**: ADMIN
**用途**: 一次性创建多个标签（导入场景）

```bash
POST /api/tags/batch
Authorization: Bearer {token}
Content-Type: application/json

[
  { "name": "TypeScript", "slug": "typescript" },
  { "name": "Node.js", "slug": "nodejs" },
  { "name": "React", "slug": "react" }
]
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "created": 3,
    "failed": 0,
    "data": [
      { "id": "tag-uuid-1", "name": "TypeScript", ... },
      { "id": "tag-uuid-2", "name": "Node.js", ... },
      { "id": "tag-uuid-3", "name": "React", ... }
    ],
    "errors": []
  }
}
```

### 3. 查询所有标签

**端点**: `GET /api/tags`
**权限**: Public
**用途**: 获取所有标签列表

```bash
GET /api/tags
```

### 4. 查询热门标签

**端点**: `GET /api/tags/popular?limit=10`
**权限**: Public
**用途**: 获取最受欢迎的标签（按内容数量排序）

```bash
GET /api/tags/popular?limit=10
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tag-uuid-1",
      "name": "JavaScript",
      "slug": "javascript",
      "_count": {
        "contents": 156  // 关联内容数量
      }
    },
    {
      "id": "tag-uuid-2",
      "name": "TypeScript",
      "slug": "typescript",
      "_count": {
        "contents": 89
      }
    }
  ]
}
```

### 5. 根据 slug 查询标签

**端点**: `GET /api/tags/slug/:slug`
**权限**: Public

```bash
GET /api/tags/slug/nestjs
```

### 6. 更新标签

**端点**: `PATCH /api/tags/:id`
**权限**: ADMIN

```bash
PATCH /api/tags/tag-uuid-123
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "NestJS Framework"
}
```

### 7. 删除标签

**端点**: `DELETE /api/tags/:id`
**权限**: ADMIN
**注意**: 有关联内容时无法删除

```bash
DELETE /api/tags/tag-uuid-123
Authorization: Bearer {token}
```

---

## 📝 内容管理 API

### 1. 创建内容（Markdown）

**端点**: `POST /api/contents`
**权限**: ADMIN, MODERATOR
**用途**: 创建新的 Markdown 文章（自动生成 HTML）

```bash
POST /api/contents
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "NestJS 最佳实践",
  "slug": "nestjs-best-practices",
  "summary": "深入探讨 NestJS 开发的最佳实践",
  "editorType": "MARKDOWN",
  "contentMd": "# NestJS 最佳实践\n\n## 模块化设计\n\n```typescript\n@Module({\n  imports: [PrismaModule],\n  controllers: [UsersController],\n  providers: [UsersService],\n})\nexport class UsersModule {}\n```\n\n使用模块化设计可以提高代码的**可维护性**。",
  "coverImage": "https://example.com/cover.jpg",
  "categoryId": "cat-uuid-123",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"],
  "isTop": false,
  "isRecommend": false
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "content-uuid-123",
    "title": "NestJS 最佳实践",
    "slug": "nestjs-best-practices",
    "summary": "深入探讨 NestJS 开发的最佳实践",
    "editorType": "MARKDOWN",
    "contentMd": "# NestJS 最佳实践\n\n...",
    "contentHtml": "<h1 id=\"nestjs-最佳实践\">NestJS 最佳实践</h1>...",  // 自动生成
    "coverImage": "https://example.com/cover.jpg",
    "status": "DRAFT",
    "viewCount": 0,
    "likeCount": 0,
    "commentCount": 0,
    "isTop": false,
    "isRecommend": false,
    "publishedAt": null,
    "author": {
      "id": "user-uuid-123",
      "userName": "admin",
      "nickName": "管理员",
      "avatar": null
    },
    "category": {
      "id": "cat-uuid-123",
      "name": "技术文章",
      "slug": "tech-articles"
    },
    "tags": [
      {
        "id": "tag-uuid-1",
        "name": "NestJS",
        "slug": "nestjs"
      },
      {
        "id": "tag-uuid-2",
        "name": "TypeScript",
        "slug": "typescript"
      }
    ],
    "createdAt": "2025-11-07T10:00:00.000Z",
    "updatedAt": "2025-11-07T10:00:00.000Z"
  }
}
```

### 2. 创建内容（富文本）

**端点**: `POST /api/contents`
**权限**: ADMIN, MODERATOR

```bash
POST /api/contents
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "产品发布公告",
  "slug": "product-announcement",
  "summary": "我们很高兴宣布新产品上线",
  "editorType": "RICHTEXT",
  "contentHtml": "<h1>产品发布公告</h1><p>我们很高兴地宣布...</p>",
  "contentRaw": "{\"ops\":[...]}",  // 可选，富文本编辑器原始数据
  "categoryId": "cat-uuid-456"
}
```

### 3. 查询内容列表（分页 + 筛选）

**端点**: `GET /api/contents`
**权限**: Public
**用途**: 查询内容列表，支持分页、搜索、筛选

**查询参数**:

| 参数 | 类型 | 说明 | 示例 |
|-----|------|------|------|
| `current` | number | 页码（默认 1） | `1` |
| `size` | number | 每页数量（默认 10） | `10` |
| `search` | string | 搜索关键词（标题/摘要） | `NestJS` |
| `status` | string | 内容状态 | `PUBLISHED` |
| `editorType` | string | 编辑器类型 | `MARKDOWN` |
| `categoryId` | string | 分类ID | `cat-uuid-123` |
| `tagId` | string | 标签ID | `tag-uuid-456` |
| `authorId` | string | 作者ID | `user-uuid-789` |
| `isTop` | boolean | 是否置顶 | `true` |
| `isRecommend` | boolean | 是否推荐 | `true` |

**示例请求**:
```bash
# 查询已发布的 NestJS 相关文章
GET /api/contents?current=1&size=10&search=NestJS&status=PUBLISHED
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "content-uuid-123",
        "title": "NestJS 最佳实践",
        // ... 完整内容信息
      }
    ],
    "current": 1,
    "size": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 4. 根据 ID 查询内容

**端点**: `GET /api/contents/:id?view=true`
**权限**: Public
**用途**: 查询单个内容详情

**查询参数**:
- `view=true`: 自动增加浏览量

```bash
GET /api/contents/content-uuid-123?view=true
```

### 5. 根据 slug 查询内容

**端点**: `GET /api/contents/slug/:slug?view=true`
**权限**: Public
**用途**: 通过 URL 友好的 slug 查询内容

```bash
GET /api/contents/slug/nestjs-best-practices?view=true
```

### 6. 更新内容

**端点**: `PATCH /api/contents/:id`
**权限**: ADMIN, MODERATOR
**用途**: 更新内容（Markdown 会自动重新解析）

```bash
PATCH /api/contents/content-uuid-123
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "NestJS 最佳实践 2025 版",
  "contentMd": "# 更新的内容...",
  "isRecommend": true
}
```

### 7. 发布内容

**端点**: `POST /api/contents/:id/publish`
**权限**: ADMIN, MODERATOR
**用途**: 将草稿发布为正式内容

```bash
POST /api/contents/content-uuid-123/publish
Authorization: Bearer {token}
Content-Type: application/json

{
  "publishedAt": "2025-11-07T10:30:00.000Z"  // 可选，不填使用当前时间
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "content-uuid-123",
    "status": "PUBLISHED",
    "publishedAt": "2025-11-07T10:30:00.000Z",
    // ... 完整内容信息
  }
}
```

### 8. 撤回发布

**端点**: `POST /api/contents/:id/unpublish`
**权限**: ADMIN, MODERATOR
**用途**: 将已发布的内容变回草稿

```bash
POST /api/contents/content-uuid-123/unpublish
Authorization: Bearer {token}
```

### 9. 归档内容

**端点**: `POST /api/contents/:id/archive`
**权限**: ADMIN
**用途**: 归档不再需要的内容

```bash
POST /api/contents/content-uuid-123/archive
Authorization: Bearer {token}
```

### 10. 删除内容

**端点**: `DELETE /api/contents/:id`
**权限**: ADMIN

```bash
DELETE /api/contents/content-uuid-123
Authorization: Bearer {token}
```

---

## 💡 实战案例

### 案例 1: 从零开始创建一篇技术博客

```bash
# 步骤 1: 登录获取 Token
curl -X POST http://localhost:9423/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
# 响应: { "success": true, "data": { "accessToken": "xxx..." } }

# 步骤 2: 创建分类
curl -X POST http://localhost:9423/api/categories \
  -H "Authorization: Bearer xxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Web 开发",
    "slug": "web-dev",
    "description": "Web 开发相关文章"
  }'
# 响应: { "success": true, "data": { "id": "cat-123", ... } }

# 步骤 3: 创建标签
curl -X POST http://localhost:9423/api/tags/batch \
  -H "Authorization: Bearer xxx..." \
  -H "Content-Type: application/json" \
  -d '[
    { "name": "JavaScript", "slug": "javascript" },
    { "name": "Vue.js", "slug": "vuejs" }
  ]'
# 响应: { "success": true, "data": { "created": 2, ... } }

# 步骤 4: 创建 Markdown 内容（草稿）
curl -X POST http://localhost:9423/api/contents \
  -H "Authorization: Bearer xxx..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vue 3 Composition API 深度解析",
    "slug": "vue3-composition-api",
    "summary": "深入理解 Vue 3 的 Composition API",
    "editorType": "MARKDOWN",
    "contentMd": "# Vue 3 Composition API\n\n## 介绍\n\n...",
    "categoryId": "cat-123",
    "tagIds": ["tag-vue", "tag-js"]
  }'
# 响应: { "success": true, "data": { "id": "content-456", "status": "DRAFT", ... } }

# 步骤 5: 发布内容
curl -X POST http://localhost:9423/api/contents/content-456/publish \
  -H "Authorization: Bearer xxx..." \
  -H "Content-Type: application/json" \
  -d '{}'
# 响应: { "success": true, "data": { "status": "PUBLISHED", ... } }

# 步骤 6: 前端查看内容
curl http://localhost:9423/api/contents/slug/vue3-composition-api?view=true
# 响应: { "success": true, "data": { "contentHtml": "...", ... } }
```

### 案例 2: 构建博客首页

```typescript
// 前端示例代码
async function buildHomePage() {
  // 1. 获取分类列表（导航菜单）
  const categories = await fetch('http://localhost:9423/api/categories').then(r => r.json());

  // 2. 获取热门标签（侧边栏）
  const popularTags = await fetch('http://localhost:9423/api/tags/popular?limit=10').then(r => r.json());

  // 3. 获取推荐文章（首页轮播）
  const featured = await fetch(
    'http://localhost:9423/api/contents?status=PUBLISHED&isRecommend=true&size=5'
  ).then(r => r.json());

  // 4. 获取最新文章列表（首页列表）
  const latest = await fetch(
    'http://localhost:9423/api/contents?status=PUBLISHED&current=1&size=10'
  ).then(r => r.json());

  return {
    categories: categories.data,
    popularTags: popularTags.data,
    featured: featured.data.records,
    latest: latest.data.records
  };
}
```

### 案例 3: 文章详情页

```typescript
async function getArticleDetail(slug: string) {
  // 1. 获取文章详情（自动增加浏览量）
  const article = await fetch(
    `http://localhost:9423/api/contents/slug/${slug}?view=true`
  ).then(r => r.json());

  // 2. 获取同分类的相关文章
  const related = await fetch(
    `http://localhost:9423/api/contents?categoryId=${article.data.category.id}&size=5`
  ).then(r => r.json());

  return {
    article: article.data,
    relatedArticles: related.data.records
  };
}
```

### 案例 4: 标签筛选页面

```typescript
async function getArticlesByTag(tagSlug: string, page: number = 1) {
  // 1. 获取标签信息
  const tag = await fetch(
    `http://localhost:9423/api/tags/slug/${tagSlug}`
  ).then(r => r.json());

  // 2. 获取该标签下的文章
  const articles = await fetch(
    `http://localhost:9423/api/contents?tagId=${tag.data.id}&status=PUBLISHED&current=${page}&size=20`
  ).then(r => r.json());

  return {
    tag: tag.data,
    articles: articles.data.records,
    pagination: {
      current: articles.data.current,
      total: articles.data.total,
      totalPages: articles.data.totalPages
    }
  };
}
```

---

## ⚠️ 错误处理

### 常见错误代码

| 状态码 | 业务代码 | 说明 | 解决方案 |
|--------|---------|------|---------|
| 400 | `VALIDATION_ERROR` | 参数验证失败 | 检查请求参数格式 |
| 401 | `UNAUTHORIZED` | 未登录或 Token 过期 | 重新登录获取 Token |
| 403 | `FORBIDDEN` | 权限不足 | 检查用户角色权限 |
| 404 | `NOT_FOUND` | 资源不存在 | 确认资源 ID 是否正确 |
| 409 | `CONFLICT` | 资源冲突（如 slug 重复） | 修改唯一标识符 |

### 错误响应示例

```json
{
  "success": false,
  "message": "URL标识符 \"nestjs-guide\" 已存在",
  "code": "CONFLICT",
  "statusCode": 409,
  "timestamp": "2025-11-07T10:30:00.000Z"
}
```

### 错误处理最佳实践

```typescript
async function createContent(data: any) {
  try {
    const response = await fetch('http://localhost:9423/api/contents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
      // 处理业务错误
      switch (result.code) {
        case 'CONFLICT':
          alert(`Slug "${data.slug}" 已被使用，请更换`);
          break;
        case 'NOT_FOUND':
          alert('分类或标签不存在，请先创建');
          break;
        case 'VALIDATION_ERROR':
          alert(`参数错误: ${result.message}`);
          break;
        default:
          alert(`操作失败: ${result.message}`);
      }
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('网络错误:', error);
    alert('网络请求失败，请稍后重试');
    return null;
  }
}
```

---

## ✅ 最佳实践

### 1. Slug 命名规范

```typescript
// ✅ 推荐
"nestjs-best-practices"
"vue3-composition-api"
"2025-annual-report"

// ❌ 不推荐
"NestJS Best Practices"  // 包��空格和大写
"vue_3_api"             // 使用下划线
"中文标题"              // 使用中文（建议翻译成拼音或英文）
```

### 2. 内容创建流程

```typescript
// 推荐的内容创建流程
async function createArticleWorkflow() {
  // 1. 先创建分类（如果不存在）
  const category = await createCategory({
    name: "技术",
    slug: "tech"
  });

  // 2. 再创建标签（如果不存在）
  const tags = await createTagsBatch([
    { name: "NestJS", slug: "nestjs" },
    { name: "TypeScript", slug: "typescript" }
  ]);

  // 3. 创建内容草稿
  const draft = await createContent({
    title: "...",
    slug: "...",
    editorType: "MARKDOWN",
    contentMd: "...",
    categoryId: category.id,
    tagIds: tags.map(t => t.id),
    // 先保存为草稿，不要直接发布
  });

  // 4. 预览确认无误后再发布
  await publishContent(draft.id);
}
```

### 3. 分页查询优化

```typescript
// ✅ 推荐：使用合理的分页大小
fetch('/api/contents?current=1&size=20')  // 每页 20 条

// ❌ 不推荐：一次性查询过多数据
fetch('/api/contents?current=1&size=1000') // 性能差
```

### 4. Markdown 内容规范

```markdown
# ✅ 推荐的 Markdown 结构

# 文章标题（只有一个 h1）

## 简介
文章简介内容...

## 第一部分
### 小节标题
内容...

## 第二部分
### 小节标题

​```typescript
// 代码示例
function example() {
  return 'Hello';
}
​```

## 总结
总结内容...
```

### 5. 前端缓存策略

```typescript
// 推荐的前端缓存策略
const cacheManager = {
  // 分类和标签可以缓存较长时间（变化不频繁）
  categories: { data: null, expiry: 30 * 60 * 1000 }, // 30分钟
  tags: { data: null, expiry: 30 * 60 * 1000 },       // 30分钟

  // 内容列表缓存较短时间
  contentList: { data: null, expiry: 5 * 60 * 1000 }, // 5分钟

  // 内容详情不缓存（确保浏览量准确）
  contentDetail: { data: null, expiry: 0 },
};
```

### 6. SEO 优化建议

```typescript
// 文章详情页 SEO 优化
function generateArticleMeta(article: any) {
  return {
    title: article.title,
    description: article.summary,
    keywords: article.tags.map(t => t.name).join(','),

    // Open Graph 标签
    og: {
      type: 'article',
      title: article.title,
      description: article.summary,
      image: article.coverImage,
      url: `https://yourdomain.com/articles/${article.slug}`,
    },

    // 结构化数据
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.summary,
      "author": {
        "@type": "Person",
        "name": article.author.nickName
      },
      "datePublished": article.publishedAt,
      "dateModified": article.updatedAt
    }
  };
}
```

---

## 📌 快速参考

### API 端点速查表

| 功能 | 方法 | 端点 | 权限 |
|------|------|------|------|
| **分类** |
| 创建分类 | POST | `/api/categories` | ADMIN |
| 查询树形 | GET | `/api/categories` | Public |
| 查询扁平 | GET | `/api/categories/flat` | Public |
| 查询单个 | GET | `/api/categories/:id` | Public |
| 根据slug | GET | `/api/categories/slug/:slug` | Public |
| 更新分类 | PATCH | `/api/categories/:id` | ADMIN |
| 删除分类 | DELETE | `/api/categories/:id` | ADMIN |
| **标签** |
| 创建标签 | POST | `/api/tags` | ADMIN |
| 批量创建 | POST | `/api/tags/batch` | ADMIN |
| 查询所有 | GET | `/api/tags` | Public |
| 热门标签 | GET | `/api/tags/popular` | Public |
| 查询单个 | GET | `/api/tags/:id` | Public |
| 根据slug | GET | `/api/tags/slug/:slug` | Public |
| 更新标签 | PATCH | `/api/tags/:id` | ADMIN |
| 删除标签 | DELETE | `/api/tags/:id` | ADMIN |
| **内容** |
| 创建内容 | POST | `/api/contents` | ADMIN/MOD |
| 查询列表 | GET | `/api/contents` | Public |
| 查询单个 | GET | `/api/contents/:id` | Public |
| 根据slug | GET | `/api/contents/slug/:slug` | Public |
| 更新内容 | PATCH | `/api/contents/:id` | ADMIN/MOD |
| 删除内容 | DELETE | `/api/contents/:id` | ADMIN |
| 发布内容 | POST | `/api/contents/:id/publish` | ADMIN/MOD |
| 撤回发布 | POST | `/api/contents/:id/unpublish` | ADMIN/MOD |
| 归档内容 | POST | `/api/contents/:id/archive` | ADMIN |

### 字段约束速查

| 字段 | 类型 | 必填 | 唯一 | 说明 |
|------|------|------|------|------|
| `name` | string | ✅ | ✅ | 名称 |
| `slug` | string | ✅ | ✅ | URL标识符 |
| `title` | string | ✅ | ❌ | 标题 |
| `editorType` | enum | ❌ | ❌ | MARKDOWN/RICHTEXT/UPLOAD |
| `contentMd` | text | ⚠️ | ❌ | Markdown时必填 |
| `contentHtml` | text | ⚠️ | ❌ | RichText时必填 |
| `categoryId` | uuid | ❌ | ❌ | 分类ID |
| `tagIds` | uuid[] | ❌ | ❌ | 标签ID数组 |

---

## 🎉 总结

本指南涵盖了内容管理系统的所有核心 API 使用方法，包括：

- ✅ 分类管理（树形结构支持）
- ✅ 标签管理（热门统计、批量创建）
- ✅ 内容管理（Markdown 自动解析、状态控制）
- ✅ 完整的使用流程和实战案例
- ✅ 错误处理和最佳实践

如有疑问，请查看：
- **Swagger 文档**: http://localhost:9423/api-docs
- **技术文档**: `docs/CONTENT_MANAGEMENT_MODULE.md`
- **Markdown 文档**: `docs/MARKDOWN_PARSER_INTEGRATION.md`

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-07
**维护者**: NestBase Team
**反馈渠道**: GitHub Issues
