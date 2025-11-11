# 内容管理模块 (CMS) 实现文档

> **创建日期**: 2025-01-07
> **版本**: v1.0.0
> **功能**: Markdown + 富文本编辑内容管理系统

---

## 📋 目录

- [功能概述](#功能概述)
- [数据模型设计](#数据模型设计)
- [API 接口清单](#api-接口清单)
- [使用示例](#使用示例)
- [技术特性](#技术特性)

---

## 🎯 功能概述

本模块实现了完整的内容管理系统（CMS），支持以下核心功能：

### ✨ 核心特性

1. **多编辑器支持**
   - ✅ Markdown 编辑器
   - ✅ 富文本编辑器 (RichText)
   - ✅ 文件上传模式 (Upload .md)
   - 可扩展其他编辑器类型

2. **内容管理**
   - ✅ CRUD 操作（创建、查询、更新、删除）
   - ✅ 草稿/发布/归档状态管理
   - ✅ 分类和标签支持
   - ✅ 封面图片
   - ✅ 浏览量统计
   - ✅ 置顶和推荐功能

3. **查询功能**
   - ✅ 分页查询
   - ✅ 关键词搜索（标题/摘要）
   - ✅ 按状态筛选
   - ✅ 按分类/标签筛选
   - ✅ 按作者筛选
   - ✅ 按编辑器类型筛选

---

## 📊 数据模型设计

### 1. Content (内容表)

```prisma
model Content {
  id             String        @id @default(uuid())
  title          String        // 标题
  slug           String        @unique // URL友好的标识符
  summary        String?       // 摘要/简介
  editorType     EditorType    @default(MARKDOWN) // 编辑器类型
  contentMd      String?       @db.Text // Markdown 原始内容
  contentHtml    String?       @db.Text // HTML 内容（富文本或解析后）
  contentRaw     String?       @db.Text // 原始内容备份（富文本编辑器）
  coverImage     String?       // 封面图片URL
  authorId       String        // 作者ID
  categoryId     String?       // 分类ID
  status         ContentStatus @default(DRAFT) // 内容状态
  viewCount      Int           @default(0) // 浏览量
  likeCount      Int           @default(0) // 点赞数
  commentCount   Int           @default(0) // 评论数
  isTop          Boolean       @default(false) // 是否置顶
  isRecommend    Boolean       @default(false) // 是否推荐
  publishedAt    DateTime?     // 发布时间
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  // 关联
  author         User          @relation
  category       Category?     @relation
  tags           ContentTag[]  // 多对多关联
}
```

### 2. EditorType (编辑器类型枚举)

```prisma
enum EditorType {
  MARKDOWN  // Markdown 编辑器
  RICHTEXT  // 富文本编辑器
  UPLOAD    // 上传 .md 文件
}
```

### 3. ContentStatus (内容状态枚举)

```prisma
enum ContentStatus {
  DRAFT      // 草稿
  PUBLISHED  // 已发布
  ARCHIVED   // 已归档
}
```

### 4. Category (分类表)

```prisma
model Category {
  id          String     @id @default(uuid())
  name        String     @unique
  slug        String     @unique
  description String?
  parentId    String?    // 支持层级分类
  order       Int        @default(0)
  status      Int        @default(1)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  parent      Category?  @relation("CategoryHierarchy")
  children    Category[] @relation("CategoryHierarchy")
  contents    Content[]
}
```

### 5. Tag (标签表)

```prisma
model Tag {
  id        String       @id @default(uuid())
  name      String       @unique
  slug      String       @unique
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  contents  ContentTag[]
}
```

### 6. ContentTag (内容-标签关联表)

```prisma
model ContentTag {
  id        String   @id @default(uuid())
  contentId String
  tagId     String
  content   Content  @relation
  tag       Tag      @relation
  createdAt DateTime @default(now())

  @@unique([contentId, tagId])
}
```

---

## 🔌 API 接口清单

### 内容管理 (`/api/contents`)

#### 1. 创建内容
```http
POST /api/contents
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "我的第一篇文章",
  "slug": "my-first-article",
  "summary": "这是文章的简短描述",
  "editorType": "MARKDOWN",
  "contentMd": "# 标题\n\n这是内容...",
  "coverImage": "https://example.com/cover.jpg",
  "categoryId": "category-uuid-123",
  "tagIds": ["tag-uuid-1", "tag-uuid-2"],
  "isTop": false,
  "isRecommend": false
}
```

**权限**: `ADMIN`, `MODERATOR`

#### 2. 查询所有内容（分页 + 搜索）
```http
GET /api/contents?current=1&size=10&search=NestJS&status=PUBLISHED&categoryId=xxx
```

**权限**: 公开访问（`@Public()`）

**查询参数**:
- `current` - 页码（默认 1）
- `size` - 每页数量（默认 10）
- `search` - 搜索关键词（标题/摘要）
- `status` - 内容状态 (DRAFT/PUBLISHED/ARCHIVED)
- `editorType` - 编辑器类型 (MARKDOWN/RICHTEXT/UPLOAD)
- `categoryId` - 分类ID
- `tagId` - 标签ID
- `authorId` - 作者ID
- `isTop` - 是否置顶 (true/false)
- `isRecommend` - 是否推荐 (true/false)

#### 3. 根据 ID 查询内容
```http
GET /api/contents/{id}?view=true
```

**权限**: 公开访问

**查询参数**:
- `view=true` - 是否增加浏览量

#### 4. 根据 slug 查询内容
```http
GET /api/contents/slug/{slug}?view=true
```

**权限**: 公开访问

**示例**: `GET /api/contents/slug/my-first-article?view=true`

#### 5. 更新内容
```http
PATCH /api/contents/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "更新后的标题",
  "contentMd": "# 更新的内容",
  "isTop": true
}
```

**权限**: `ADMIN`, `MODERATOR`

#### 6. 删除内容
```http
DELETE /api/contents/{id}
Authorization: Bearer {token}
```

**权限**: `ADMIN`

#### 7. 发布内容
```http
POST /api/contents/{id}/publish
Authorization: Bearer {token}
Content-Type: application/json

{
  "publishedAt": "2025-01-07T10:30:00.000Z"  // 可选，不填使用当前时间
}
```

**权限**: `ADMIN`, `MODERATOR`

#### 8. 撤回发布（变为草稿）
```http
POST /api/contents/{id}/unpublish
Authorization: Bearer {token}
```

**权限**: `ADMIN`, `MODERATOR`

#### 9. 归档内容
```http
POST /api/contents/{id}/archive
Authorization: Bearer {token}
```

**权限**: `ADMIN`

---

### 分类管理 (`/api/categories`)

模块已创建，待实现完整CRUD接口。

### 标签管理 (`/api/tags`)

模块已创建，待实现完整CRUD接口。

---

## 💡 使用示例

### 场景 1: 创建 Markdown 文章

```typescript
// 前端代码示例
const createMarkdownArticle = async () => {
  const response = await fetch('/api/contents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'NestJS 最佳实践',
      slug: 'nestjs-best-practices',
      summary: '本文介绍 NestJS 开发的最佳实践',
      editorType: 'MARKDOWN',
      contentMd: `
# NestJS 最佳实践

## 1. 模块化设计

使用模块化设计可以提高代码的可维护性...

## 2. 依赖注入

NestJS 的依赖注入系统非常强大...
      `,
      categoryId: 'tech-category-id',
      tagIds: ['nestjs-tag-id', 'typescript-tag-id'],
      isRecommend: true,
    }),
  });

  const data = await response.json();
  console.log('创建成功:', data);
};
```

### 场景 2: 创建富文本内容

```typescript
const createRichTextArticle = async () => {
  const response = await fetch('/api/contents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: '产品发布公告',
      slug: 'product-announcement',
      summary: '我们很高兴宣布新产品上线',
      editorType: 'RICHTEXT',
      contentHtml: '<h1>产品发布公告</h1><p>我们很高兴地宣布...</p>',
      contentRaw: '{"ops":[{"insert":"产品发布公告\\n","attributes":{"header":1}}]}', // Quill Delta格式
      coverImage: 'https://example.com/announcement.jpg',
      categoryId: 'news-category-id',
    }),
  });

  const data = await response.json();
  console.log('创建成功:', data);
};
```

### 场景 3: 查询并展示文章列表

```typescript
const fetchArticles = async (page = 1) => {
  const response = await fetch(
    `/api/contents?current=${page}&size=10&status=PUBLISHED&isRecommend=true`
  );

  const data = await response.json();

  if (data.success) {
    console.log('文章列表:', data.data.records);
    console.log('总数:', data.data.total);
    console.log('总页数:', data.data.totalPages);
  }
};
```

### 场景 4: 查看文章详情（增加浏览量）

```typescript
const viewArticle = async (slug: string) => {
  const response = await fetch(`/api/contents/slug/${slug}?view=true`);
  const data = await response.json();

  if (data.success) {
    const article = data.data;
    console.log('标题:', article.title);
    console.log('作者:', article.author.nickName);
    console.log('浏览量:', article.viewCount);
    console.log('内容:', article.contentHtml || article.contentMd);
    console.log('标签:', article.tags);
  }
};
```

### 场景 5: 发布草稿

```typescript
const publishDraft = async (contentId: string) => {
  const response = await fetch(`/api/contents/${contentId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publishedAt: new Date().toISOString(), // 立即发布
    }),
  });

  const data = await response.json();
  console.log('发布成功:', data);
};
```

---

## 🚀 技术特性

### 1. 编辑器类型抽象

通过 `editorType` 字段，系统支持多种编辑器：

| 编辑器类型 | 说明 | 存储字段 |
|-----------|------|---------|
| `MARKDOWN` | Markdown 编辑器 | `contentMd` (必填), `contentHtml` (可选) |
| `RICHTEXT` | 富文本编辑器 | `contentHtml` (必填), `contentRaw` (可选) |
| `UPLOAD` | 上传 .md 文件 | `contentMd` (必填), `contentHtml` (可选) |

### 2. 内容字段设计

- **contentMd**: 存储原始 Markdown 文本
- **contentHtml**: 存储渲染后的 HTML（用于前端展示）
- **contentRaw**: 存储富文本编辑器的原始数据（如 Quill Delta JSON）

### 3. URL 友好标识符

每篇内容都有唯一的 `slug`，可用于生成 SEO 友好的 URL：
- `/articles/nestjs-best-practices`
- `/blog/product-announcement`

### 4. 状态管理

内容生命周期：
```
DRAFT (草稿) → PUBLISHED (已发布) → ARCHIVED (已归档)
           ↑          ↓
           └──────────┘
           (可撤回发布)
```

### 5. 权限控制

| 操作 | 权限要求 |
|------|---------|
| 查看内容 | 公开访问 |
| 创建内容 | ADMIN, MODERATOR |
| 编辑内容 | ADMIN, MODERATOR |
| 删除内容 | ADMIN |
| 发布/撤回 | ADMIN, MODERATOR |
| 归档内容 | ADMIN |

### 6. 关联数据

内容自动关联：
- **作者信息**: `{ id, userName, nickName, avatar }`
- **分类信息**: 完整的 Category 对象
- **标签列表**: Tag 对象数组

### 7. 搜索和筛选

支持多维度查询：
- 全文搜索（标题、摘要）
- 状态筛选
- 分类/标签筛选
- 作者筛选
- 置顶/推荐筛选

---

## 📦 模块结构

```
src/modules/
├── contents/
│   ├── dto/
│   │   ├── create-content.dto.ts     # 创建内容 DTO
│   │   ├── update-content.dto.ts     # 更新内容 DTO
│   │   ├── query-content.dto.ts      # 查询内容 DTO
│   │   ├── publish-content.dto.ts    # 发布内容 DTO
│   │   └── index.ts
│   ├── contents.controller.ts         # 控制器（API 路由）
│   ├── contents.service.ts            # 服务层（业务逻辑）
│   └── contents.module.ts             # 模块定义
├── categories/
│   ├── dto/
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   └── categories.module.ts
└── tags/
    ├── dto/
    ├── tags.controller.ts
    ├── tags.service.ts
    └── tags.module.ts
```

---

## 🔧 后续优化建议

### 短期（1-2周）

1. **完善 Categories 模块**
   - 实现完整的 CRUD 接口
   - 支持层级分类查询

2. **完善 Tags 模块**
   - 实现完整的 CRUD 接口
   - 标签关联数量统计

3. **Markdown 解析器集成**
   - 安装 `marked` 库
   - 实现 Markdown → HTML 自动转换
   - 支持代码高亮

### 中期（1-2月）

1. **内容版本控制**
   - 保存历史版本
   - 版本对比
   - 版本回滚

2. **评论系统**
   - 用户评论
   - 评论审核
   - 评论回复

3. **点赞功能**
   - 用户点赞
   - 点赞数统计
   - 防止重复点赞

### 长期（3-6月）

1. **SEO 优化**
   - Meta 标签管理
   - Sitemap 自动生成
   - 结构化数据

2. **内容推荐**
   - 相关文章推荐
   - 热门文章排行
   - 个性化推荐

3. **多语言支持**
   - 内容国际化
   - 多语言版本管理

---

## 📝 总结

本模块实现了：

✅ 完整的内容管理系统（CMS）
✅ 多编辑器类型支持（Markdown/富文本/上传）
✅ 灵活的内容字段设计
✅ 完善的状态管理和权限控制
✅ 强大的查询和筛选功能
✅ SEO 友好的 URL 设计
✅ 分类和标签系统
✅ 浏览量统计
✅ 置顶和推荐功能

---

**文档版本**: v1.0.0
**最后更新**: 2025-01-07
**维护者**: NestBase Team
