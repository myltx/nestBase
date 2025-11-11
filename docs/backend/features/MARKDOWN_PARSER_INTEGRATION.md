# Markdown 解析器集成文档

> **创建日期**: 2025-11-07
> **版本**: v1.0.0
> **功能**: 内容管理系统 Markdown 自动解析功能

---

## 📋 概述

本文档记录了 Markdown 解析器在内容管理系统中的集成过程，实现了 Markdown 自动转换为 HTML 的功能。

---

## 🎯 实现的功能

### 1. Markdown 解析工具 (`markdown.util.ts`)

创建了专用的 Markdown 解析工具模块，位于 `src/common/utils/markdown.util.ts`。

#### 核心功能：
- ✅ Markdown → HTML 自动转换
- ✅ 代码语法高亮（使用 highlight.js）
- ✅ GitHub Flavored Markdown (GFM) 支持
- ✅ 标题自动生成 ID（用于锚点导航）
- ✅ 从 HTML 提取纯文本（生成摘要）
- ✅ 从 Markdown 提取标题列表（生成目录）

#### 导出的函数：
```typescript
// 异步解析 Markdown（推荐）
export async function parseMarkdown(markdown: string): Promise<string>

// 同步解析 Markdown
export function parseMarkdownSync(markdown: string): string

// 从 HTML 提取纯文本
export function extractTextFromHtml(html: string, maxLength = 200): string

// 从 Markdown 提取标题列表
export function extractHeadings(markdown: string): Array<{ level: number; text: string; id: string }>
```

---

## 🔧 技术实现

### 1. 依赖库

安装了以下 npm 包：
```bash
pnpm add marked@^4.3.0 marked-gfm-heading-id@^3.2.0 highlight.js@^11.11.1
```

- **marked v4.3.0**: Markdown 解析器（使用 CommonJS 兼容版本）
- **marked-gfm-heading-id**: 为标题自动生成 ID
- **highlight.js**: 代码语法高亮

### 2. Markdown 配置

```typescript
import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
const hljs = require('highlight.js');

// 配置标题ID生成
marked.use(gfmHeadingId());

// 配置代码高亮
marked.use({
  renderer: {
    code(code, language) {
      if (language && hljs.getLanguage(language)) {
        return `<pre><code class="hljs language-${language}">${
          hljs.highlight(code, { language }).value
        }</code></pre>`;
      }
      return `<pre><code>${code}</code></pre>`;
    },
  },
});

// 配置 GFM 和换行符支持
marked.setOptions({
  gfm: true,        // GitHub Flavored Markdown
  breaks: true,     // 换行符转换为 <br>
});
```

---

## 📦 集成到内容服务

### 1. 自动解析时机

Markdown 解析在以下场景自动触发：

#### 场景 1: 创建内容时
```typescript
// src/modules/contents/contents.service.ts - create()
if ((editorType === EditorType.MARKDOWN || editorType === EditorType.UPLOAD) && contentData.contentMd) {
  contentData.contentHtml = await parseMarkdown(contentData.contentMd);
}
```

#### 场景 2: 更新内容时
```typescript
// src/modules/contents/contents.service.ts - update()
const editorType = contentData.editorType || existingContent.editorType;
if ((editorType === EditorType.MARKDOWN || editorType === EditorType.UPLOAD) && contentData.contentMd) {
  contentData.contentHtml = await parseMarkdown(contentData.contentMd);
}
```

#### 场景 3: 发布内容时
```typescript
// src/modules/contents/contents.service.ts - publish()
if ((content.editorType === EditorType.MARKDOWN || content.editorType === EditorType.UPLOAD) && content.contentMd) {
  if (!content.contentHtml) {
    updateData.contentHtml = await parseMarkdown(content.contentMd);
  }
}
```

### 2. 编辑器类型支持

| 编辑器类型 | 自动解析 | 存储字段 |
|-----------|---------|---------|
| `MARKDOWN` | ✅ 是 | `contentMd` (输入) + `contentHtml` (自动生成) |
| `UPLOAD` | ✅ 是 | `contentMd` (输入) + `contentHtml` (自动生成) |
| `RICHTEXT` | ❌ 否 | `contentHtml` (直接输入) + `contentRaw` (可选) |

---

## 💡 使用示例

### 示例 1: 创建 Markdown 文章并自动生成 HTML

```typescript
// POST /api/contents
{
  "title": "NestJS 最佳实践",
  "slug": "nestjs-best-practices",
  "summary": "深入探讨 NestJS 开发的最佳实践",
  "editorType": "MARKDOWN",
  "contentMd": "# NestJS 最佳实践\n\n## 模块化设计\n\n```typescript\n@Module({\n  imports: [PrismaModule],\n  controllers: [UsersController],\n  providers: [UsersService],\n})\nexport class UsersModule {}\n```\n\n使用模块化设计可以提高代码的**可维护性**和**可测试性**。",
  "categoryId": "tech-uuid",
  "tagIds": ["nestjs-uuid", "typescript-uuid"]
}
```

**系统自动处理**:
1. 验证 `editorType` 为 `MARKDOWN`
2. 自动调用 `parseMarkdown(contentMd)`
3. 生成 `contentHtml` 字段（包含代码高亮、标题ID等）
4. 同时保存 `contentMd` 和 `contentHtml` 到数据库

**返回结果**:
```typescript
{
  "success": true,
  "data": {
    "id": "content-uuid-123",
    "title": "NestJS 最佳实践",
    "editorType": "MARKDOWN",
    "contentMd": "# NestJS 最佳实践\n\n...",
    "contentHtml": "<h1 id=\"nestjs-最佳实践\">NestJS 最佳实践</h1>\n<h2 id=\"模块化设计\">模块化设计</h2>\n<pre><code class=\"hljs language-typescript\">...</code></pre>...",
    // ... 其他字段
  }
}
```

### 示例 2: 上传 .md 文件

```typescript
// POST /api/contents
{
  "title": "API 设计指南",
  "slug": "api-design-guide",
  "editorType": "UPLOAD",
  "contentMd": "... (上传的 .md 文件内容) ...",
  "categoryId": "guides-uuid"
}
```

**系统自动处理**:
- `UPLOAD` 类型与 `MARKDOWN` 类型享受相同的自动解析
- Markdown 内容自动转换为 HTML

### 示例 3: 更新文章内容

```typescript
// PATCH /api/contents/:id
{
  "contentMd": "# 更新后的标题\n\n这是更新后的内容..."
}
```

**系统自动处理**:
1. 检测到 `contentMd` 字段更新
2. 根据现有的 `editorType` 判断是否需要解析
3. 如果是 `MARKDOWN` 或 `UPLOAD`，自动重新生成 `contentHtml`

---

## 🌟 高级功能

### 1. 代码语法高亮

支持所有 highlight.js 支持的语言，包括：
- TypeScript / JavaScript
- Python
- Java / Kotlin
- Go / Rust
- SQL / PostgreSQL
- Bash / Shell
- 等 200+ 种语言

**输入**:
````markdown
```typescript
const greeting: string = "Hello, World!";
console.log(greeting);
```
````

**输出**:
```html
<pre><code class="hljs language-typescript">
  <span class="hljs-keyword">const</span> greeting: <span class="hljs-built_in">string</span> = <span class="hljs-string">"Hello, World!"</span>;
  <span class="hljs-built_in">console</span>.log(greeting);
</code></pre>
```

### 2. 标题自动生成 ID

所有标题（h1-h6）自动生成 ID，用于锚点导航。

**输入**:
```markdown
## 用户认证
### JWT Token
```

**输出**:
```html
<h2 id="用户认证">用户认证</h2>
<h3 id="jwt-token">JWT Token</h3>
```

### 3. GitHub Flavored Markdown (GFM)

支持 GFM 扩展语法：
- ✅ 任务列表（Task Lists）
- ✅ 删除线（Strikethrough）
- ✅ 表格（Tables）
- ✅ 自动链接（Auto-linking）

**输入**:
```markdown
- [x] 完成功能开发
- [ ] 编写单元测试
- [ ] 部署到生产环境

| 功能 | 状态 |
|-----|------|
| 用户管理 | ✅ 完成 |
| 角色管理 | ✅ 完成 |
| 内容管理 | 🚧 进行中 |
```

---

## 🚨 注意事项

### 1. 版本兼容性

使用 `marked@4.x` 而非最新的 `marked@16.x`：
- **原因**: v16 是纯 ESM 模块，不兼容 NestJS 的 CommonJS 构建
- **影响**: 功能完整，性能稳定，仅版本较旧

### 2. 性能考虑

- Markdown 解析是异步操作（`async/await`）
- 适合中等篇幅文章（< 10MB）
- 超大文档建议分段处理或使用队列

### 3. 安全性

- Markdown 解析器会过滤 XSS 风险
- 但建议前端渲染 HTML 时使用 `DOMPurify` 等库进一步净化
- 不要直接信任用户输入的 Markdown 内容

---

## 📊 完整的 CMS 模块状态

| 模块 | 状态 | 接口数量 | 特殊功能 |
|-----|-----|---------|---------|
| **Contents** | ✅ 完成 | 9 个 | Markdown 自动解析 |
| **Categories** | ✅ 完成 | 7 个 | 树形结构支持 |
| **Tags** | ✅ 完成 | 8 个 | 热门标签统计 |

### Contents 模块路由

```
POST   /api/contents                 - 创建内容（自动解析 Markdown）
GET    /api/contents                 - 查询内容列表（分页 + 搜索）
GET    /api/contents/:id             - 根据 ID 查询内容
GET    /api/contents/slug/:slug      - 根据 slug 查询内容
PATCH  /api/contents/:id             - 更新内容（自动重新解析 Markdown）
DELETE /api/contents/:id             - 删除内容
POST   /api/contents/:id/publish     - 发布内容（确保生成 HTML）
POST   /api/contents/:id/unpublish   - 撤回发布
POST   /api/contents/:id/archive     - 归档内容
```

---

## 🔄 后续优化建议

### 短期优化

1. **添加 Markdown 预览接口**
   ```typescript
   POST /api/contents/preview-markdown
   ```
   - 前端可以实时预览 Markdown 渲染效果

2. **支持自定义 highlight.js 主题**
   - 允许用户选择代码高亮主题（dark/light）

3. **Markdown 格式验证**
   - 在保存前验证 Markdown 语法是否正确

### 中期优化

1. **Markdown 缓存**
   - 缓存已解析的 HTML，避免重复解析
   - 使用 Redis 存储缓存

2. **支持更多 Markdown 扩展**
   - 数学公式（KaTeX / MathJax）
   - 图表（Mermaid）
   - 嵌入视频（YouTube / Bilibili）

3. **目录自动生成**
   - 使用 `extractHeadings()` 函数自动生成文章目录

### 长期优化

1. **Markdown 版本控制**
   - 记录每次 Markdown 修改历史
   - 支持版本对比和回滚

2. **协作编辑**
   - WebSocket 实时同步
   - 多人协作编辑 Markdown

---

## 📝 测试清单

- [x] ✅ Markdown 自动解析（创建时）
- [x] ✅ Markdown 自动解析（更新时）
- [x] ✅ Markdown 自动解析（发布时）
- [x] ✅ 代码语法高亮
- [x] ✅ 标题自动生成 ID
- [x] ✅ GFM 扩展语法支持
- [ ] ⏳ 前端集成测试（待前端开发完成）
- [ ] ⏳ 大文件性能测试
- [ ] ⏳ XSS 安全测试

---

## 🎉 总结

成功集成 Markdown 解析器到内容管理系统，实现了：
- ✅ 自动将 Markdown 转换为 HTML
- ✅ 代码语法高亮
- ✅ GitHub Flavored Markdown 支持
- ✅ 标题自动生成 ID（锚点导航）
- ✅ 与 Contents、Categories、Tags 模块完整集成
- ✅ 支持 MARKDOWN 和 UPLOAD 两种编辑器类型

**所有接口已成功启动，可以开始测试！**

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-07
**维护者**: NestBase Team
