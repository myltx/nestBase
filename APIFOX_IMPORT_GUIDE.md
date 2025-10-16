# Apifox 自动导入 API 文档指南

## 🎯 功能说明

本项目已实现 OpenAPI 3.0 规范的 JSON 文档导出功能，可以方便地导入到 Apifox、Postman、Insomnia 等 API 测试工具中。

---

## 📄 可用的文档接口

### 1. OpenAPI JSON 文档（推荐用于导入）

**接口地址**：`http://localhost:3001/api/swagger/json`

**用途**：完整的 OpenAPI 3.0 规范 JSON 文档

**响应格式**：✅ **直接返回 OpenAPI JSON**（不包装，符合标准）

**特点**：
- ✅ 包含所有 API 端点定义
- ✅ 包含请求/响应 Schema
- ✅ 包含认证配置（JWT Bearer Token）
- ✅ 包含示例数据
- ✅ 符合 OpenAPI 3.0 标准
- ✅ **直接返回标准格式**（使用 `@SkipTransform()` 跳过响应包装）

**响应示例**：
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "NestBase API Documentation",
    "description": "基于 NestJS + Supabase + Prisma 的后端服务框架",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "http://localhost:3001",
      "description": "本地开发环境"
    }
  ],
  "paths": {
    "/api/auth/register": { ... },
    "/api/auth/login": { ... },
    ...
  },
  "components": {
    "securitySchemes": {
      "access-token": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}
```

**⚠️ 注意**：此接口直接返回 OpenAPI JSON，**不会**包装在 `{ success: true, data: {...} }` 格式中
```

### 2. API 统计信息

**接口地址**：`http://localhost:3001/api/swagger/stats`

**用途**：查看 API 统计信息

**响应示例**：
```json
{
  "success": true,
  "data": {
    "title": "NestBase API Documentation",
    "version": "1.0",
    "description": "基于 NestJS + Supabase + Prisma 的后端服务框架",
    "totalEndpoints": 18,
    "totalPaths": 14,
    "totalTags": 4,
    "tags": [
      {
        "name": "认证模块",
        "description": "用户认证相关接口"
      },
      {
        "name": "用户模块",
        "description": "用户管理相关接口"
      },
      {
        "name": "项目管理",
        "description": "项目展示相关接口"
      },
      {
        "name": "系统",
        "description": null
      }
    ],
    "servers": [
      {
        "url": "http://localhost:3001",
        "description": "本地开发环境"
      }
    ]
  }
}
```

---

## 🚀 Apifox 导入步骤

### 方法 1：使用 URL 自动导入（推荐）

1. **启动本地服务**
   ```bash
   cd apps/backend
   pnpm dev
   # 确保服务运行在 http://localhost:3001
   ```

2. **打开 Apifox**
   - 选择或创建一个项目

3. **导入数据**
   - 点击左侧菜单 "导入"
   - 选择 "URL 导入"
   - 输入 URL：`http://localhost:3001/api/swagger/json`
   - 点击 "导入"

4. **配置环境**
   - 创建环境变量 `baseUrl` = `http://localhost:3001`
   - 如果需要认证，配置 JWT Token

### 方法 2：下载 JSON 文件导入

1. **下载 OpenAPI JSON**
   ```bash
   curl http://localhost:3001/api/swagger/json > openapi.json
   ```

2. **在 Apifox 中导入**
   - 点击 "导入"
   - 选择 "文件导入"
   - 选择刚下载的 `openapi.json` 文件
   - 点击 "导入"

### 方法 3：使用 Swagger UI 链接

Apifox 也支持从 Swagger UI 导入：

- Swagger UI 地址：`http://localhost:3001/api-docs`
- 在 Apifox 中选择 "从 Swagger 导入"
- 输入上述地址

---

## 🔄 定时同步更新

### 自动同步配置

Apifox 支持定时从 URL 同步最新的 API 文档：

1. 导入后，在项目设置中找到 "数据同步"
2. 配置同步源：`http://localhost:3001/api/swagger/json`
3. 设置同步频率（如每小时、每天）
4. Apifox 会自动获取最新的 API 定义

### 手动同步

点击 Apifox 右上角的 "同步" 按钮即可手动同步最新接口。

---

## 📚 导入后的功能

导入成功后，Apifox 会自动识别：

### ✅ 接口分组

按照以下标签自动分组：
- 认证模块（/api/auth）
- 用户模块（/api/users）
- 项目管理（/api/projects）
- 系统（/api/swagger）

### ✅ 认证配置

已自动配置 Bearer Token 认证：
1. 在 Apifox 中点击 "认证"
2. 选择 "Bearer Token"
3. 输入你的 JWT Token

### ✅ 请求示例

每个接口都包含：
- 完整的请求参数说明
- 请求体 Schema
- 响应体 Schema
- 示例数据

### ✅ 数据模型

自动导入所有 DTO 定义：
- RegisterDto
- LoginDto
- CreateProjectDto
- UpdateProjectDto
- QueryProjectDto
- 等等...

---

## 🧪 测试认证接口

### 1. 用户登录

```http
POST {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "username": "admin@example.com",
  "password": "admin123"
}
```

### 2. 保存 Token

登录成功后，复制响应中的 `token.accessToken` 值。

### 3. 配置全局认证

在 Apifox 环境变量中添加：
- 变量名：`token`
- 变量值：`<你的 JWT Token>`

### 4. 使用认证

在需要认证的接口中：
- 选择 "Auth" 标签
- 选择 "Bearer Token"
- Token 值填写：`{{token}}`

---

## 🌐 生产环境配置

### 更新服务器地址

在 `.env` 文件中配置生产环境 URL：

```env
# 生产环境
PRODUCTION_URL=https://api.yourdomain.com
```

修改 `swagger.config.ts` 添加生产服务器：

```typescript
.addServer('http://localhost:3001', '本地开发环境')
.addServer('https://api.yourdomain.com', '生产环境')
```

### 生产环境导入

使用生产环境的 OpenAPI JSON 地址：
```
https://api.yourdomain.com/api/swagger/json
```

---

## 💡 高级用法

### 使用 Postman 导入

Postman 同样支持 OpenAPI 3.0 格式：

1. 打开 Postman
2. 点击 "Import"
3. 选择 "Link" 标签
4. 输入：`http://localhost:3001/api/swagger/json`
5. 点击 "Continue" 导入

### 使用 Insomnia 导入

1. 打开 Insomnia
2. 点击 "Import/Export"
3. 选择 "Import Data" → "From URL"
4. 输入：`http://localhost:3001/api/swagger/json`
5. 点击 "Fetch and Import"

### 生成客户端 SDK

使用 OpenAPI Generator 生成客户端代码：

```bash
# 安装 OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# 生成 TypeScript Axios 客户端
openapi-generator-cli generate \
  -i http://localhost:3001/api/swagger/json \
  -g typescript-axios \
  -o ./generated-client

# 生成 Java 客户端
openapi-generator-cli generate \
  -i http://localhost:3001/api/swagger/json \
  -g java \
  -o ./java-client
```

---

## 🐛 常见问题

### Q1: 无法访问 OpenAPI JSON 接口

**原因**：服务未启动或端口不匹配

**解决**：
```bash
# 检查服务是否运行
lsof -i:3001

# 启动服务
cd apps/backend
pnpm dev
```

### Q2: Apifox 导入后没有数据

**原因**：返回的不是有效的 JSON

**解决**：
```bash
# 测试接口
curl http://localhost:3001/api/swagger/json | jq '.'

# 确保返回有效的 OpenAPI JSON
```

### Q3: 接口更新后 Apifox 没有同步

**解决**：
1. 在 Apifox 中手动点击 "同步" 按钮
2. 或删除后重新导入
3. 检查自动同步配置是否正确

### Q4: 认证失败

**解决**：
1. 确保先调用 `/api/auth/login` 获取 Token
2. 在 Apifox 中正确配置 Bearer Token
3. 检查 Token 是否过期（默认 7 天）

---

## 📖 相关文档

- [NestJS Swagger 文档](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI 3.0 规范](https://swagger.io/specification/)
- [Apifox 官方文档](https://apifox.com/help/)

---

## ✅ 验证导入成功

导入成功后，你应该能看到：

- ✅ 18 个 API 端点
- ✅ 4 个接口分组
- ✅ 完整的请求/响应定义
- ✅ Bearer Token 认证配置
- ✅ 所有 DTO 数据模型

**测试建议**：
1. 先测试公开接口（如 GET /api/projects）
2. 再测试登录接口获取 Token
3. 最后测试需要认证的接口

---

**最后更新**：2025-10-16
**项目版本**：1.0.0
**OpenAPI 版本**：3.0.0
