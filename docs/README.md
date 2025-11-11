# NestBase 项目文档中心

> 📚 **文档版本**: v2.0.0
> 📅 **最后更新**: 2025-11-11
> 🏗️ **项目**: NestBase - 现代化全栈 Monorepo 框架

---

## 📂 文档结构总览

```
docs/
├── README.md                    # 本文件 - 文档中心导航
├── backend/                     # 后端服务文档
│   ├── README.md               # Backend 文档索引
│   ├── architecture/           # 架构设计
│   ├── features/               # 功能发布
│   ├── guides/                 # 使用指南
│   ├── migrations/             # 数据库迁移
│   └── api/                    # API 参考
├── frontend/                    # 前端服务文档（预留）
│   └── README.md               # Frontend 文档索引（待添加）
└── project/                     # 项目级文档
    ├── README.md               # 项目文档索引
    ├── setup/                  # 项目设置和配置
    ├── development/            # 开发和维护
    ├── features/               # 功能实现和迁移
    ├── api-tools/              # API 工具和集成
    └── project-management/     # 项目管理和交付
```

---

## 🎯 快速导航

### 按服务查看

| 服务 | 说明 | 文档入口 | 文档数量 |
|------|------|---------|---------|
| 🔧 **Backend** | NestJS 后端服务技术文档 | [docs/backend/README.md](./backend/README.md) | 29 个 |
| 🎨 **Frontend** | 前端服务文档（预留） | [docs/frontend/README.md](./frontend/README.md) | - |
| 📦 **Project** | 项目级配置和管理文档 | [docs/project/README.md](./project/README.md) | 19 个 |

### 按角色查看

#### 🏗️ 新开发人员入门

**推荐阅读顺序**:
1. [快速开始](./project/setup/QUICKSTART.md) - 4步快速启动项目
2. [Supabase 配置](./project/setup/SUPABASE_SETUP.md) - 数据库环境配置
3. [Monorepo 架构](./project/setup/MONOREPO.md) - 了解项目结构
4. [开发规范](./project/setup/AGENTS.md) - 代码规范和提交规范
5. [RBAC 权限系统](./project/features/RBAC_GUIDE.md) - 权限系统使用

#### 💻 后端开发人员

**推荐阅读顺序**:
1. [API 命名规范](./backend/architecture/API_NAMING_CONVENTION.md)
2. [业务状态码](./backend/architecture/BUSINESS_CODES.md)
3. [日志管理系统](./backend/features/LOGGING_SYSTEM_RELEASE.md)
4. [CMS API 指南](./backend/guides/CMS_API_GUIDE.md)
5. [数据库迁移指南](./backend/migrations/MIGRATION_GUIDE.md)

#### 🎨 前端开发人员

**推荐阅读顺序**:
1. [Apifox 导入指南](./project/api-tools/APIFOX_IMPORT_GUIDE.md) - API 文档导入
2. [CMS API 使用指南](./backend/guides/CMS_API_GUIDE.md) - CMS 接口使用
3. [菜单管理指南](./backend/guides/MENU_MANAGEMENT.md) - 菜单系统
4. [用户角色 API](./backend/guides/API_USER_ROLES.md) - 用户权限
5. [业务状态码](./backend/architecture/BUSINESS_CODES.md) - 错误处理

#### 🧪 测试人员

**推荐阅读顺序**:
1. [Apifox 导入指南](./project/api-tools/APIFOX_IMPORT_GUIDE.md)
2. [API 使用指南](./backend/guides/) - 所有 API 文档
3. [功能发布文档](./backend/features/) - 功能测试用例

#### 🔧 DevOps / 运维人员

**推荐阅读顺序**:
1. [Supabase 配置](./project/setup/SUPABASE_SETUP.md) - 数据库配置
2. [数据库迁移](./backend/migrations/) - Schema 变更
3. [项目交付报告](./project/project-management/PROJECT_DELIVERY.md)

#### 🏛️ 架构师 / 技术负责人

**推荐阅读顺序**:
1. [Monorepo 架构](./project/setup/MONOREPO.md)
2. [架构设计文档](./backend/architecture/) - 所有架构文档
3. [RBAC 重新设计](./project/features/RBAC_REDESIGN.md)
4. [功能发布文档](./backend/features/) - 核心功能实现
5. [项目交付报告](./project/project-management/PROJECT_DELIVERY.md)

---

## 📚 文档分类

### 🔧 Backend 后端服务文档 (29 个文档)

后端 NestJS 应用的完整技术文档。

| 分类 | 数量 | 说明 | 入口 |
|------|------|------|------|
| **架构设计** | 6 | API 规范、业务状态码、验证配置 | [architecture/](./backend/architecture/) |
| **功能发布** | 10 | 日志系统、CMS、Token、权限等 | [features/](./backend/features/) |
| **使用指南** | 6 | CMS API、菜单、用户角色等 | [guides/](./backend/guides/) |
| **数据库迁移** | 4 | Schema 变更记录和迁移指南 | [migrations/](./backend/migrations/) |
| **API 参考** | 2 | 接口修复和实现记录 | [api/](./backend/api/) |

📖 **详细索引**: [docs/backend/README.md](./backend/README.md)

### 📦 Project 项目级文档 (19 个文档)

项目配置、开发流程和管理文档。

| 分类 | 数量 | 说明 | 入口 |
|------|------|------|------|
| **项目设置** | 5 | 快速开始、环境配置、架构说明 | [setup/](./project/setup/) |
| **开发维护** | 4 | 变更日志、代码检查、文档更新 | [development/](./project/development/) |
| **功能实现** | 3 | RBAC 权限系统设计和迁移 | [features/](./project/features/) |
| **API 工具** | 3 | Apifox、OpenAPI 导出和集成 | [api-tools/](./project/api-tools/) |
| **项目管理** | 4 | 交付报告、项目总结和清单 | [project-management/](./project/project-management/) |

📖 **详细索引**: [docs/project/README.md](./project/README.md)

### 🎨 Frontend 前端服务文档

前端应用文档（预留，待前端项目启动后添加）。

📖 **详细索引**: [docs/frontend/README.md](./frontend/README.md)

---

## 🔍 按主题搜索

### 核心主题

| 主题 | 相关文档 |
|------|---------|
| **🚀 快速开始** | [QUICKSTART.md](./project/setup/QUICKSTART.md), [SUPABASE_SETUP.md](./project/setup/SUPABASE_SETUP.md) |
| **🏗️ 架构设计** | [MONOREPO.md](./project/setup/MONOREPO.md), [Backend Architecture](./backend/architecture/) |
| **🔐 权限系统** | [RBAC_GUIDE.md](./project/features/RBAC_GUIDE.md), [RBAC_REDESIGN.md](./project/features/RBAC_REDESIGN.md), [ROLE_MIGRATION.md](./backend/features/ROLE_MIGRATION.md) |
| **📝 命名规范** | [API_NAMING_CONVENTION.md](./backend/architecture/API_NAMING_CONVENTION.md), [NAMING_CONVENTION_CONCLUSION.md](./backend/architecture/NAMING_CONVENTION_CONCLUSION.md) |
| **❌ 错误处理** | [BUSINESS_CODES.md](./backend/architecture/BUSINESS_CODES.md), [BUSINESS_CODES_IMPLEMENTATION.md](./backend/architecture/BUSINESS_CODES_IMPLEMENTATION.md) |
| **🔑 认证授权** | [TOKEN_*.md](./backend/features/), [API_USER_ROLES.md](./backend/guides/API_USER_ROLES.md) |
| **📊 日志系统** | [LOGGING_SYSTEM_RELEASE.md](./backend/features/LOGGING_SYSTEM_RELEASE.md), [AUDIT_USAGE.md](./backend/guides/AUDIT_USAGE.md) |
| **📰 内容管理** | [CONTENT_MANAGEMENT_MODULE.md](./backend/features/CONTENT_MANAGEMENT_MODULE.md), [CMS_API_GUIDE.md](./backend/guides/CMS_API_GUIDE.md) |
| **🍔 菜单管理** | [MENU_MANAGEMENT.md](./backend/guides/MENU_MANAGEMENT.md), [CREATE_MENU_*.md](./backend/api/) |
| **🔄 数据库迁移** | [MIGRATION_GUIDE.md](./backend/migrations/MIGRATION_GUIDE.md), [All migrations](./backend/migrations/) |
| **🔌 API 工具** | [APIFOX_IMPORT_GUIDE.md](./project/api-tools/APIFOX_IMPORT_GUIDE.md), [OPENAPI_*.md](./project/api-tools/) |
| **📈 版本历史** | [CHANGELOG.md](./project/development/CHANGELOG.md) |
| **🎯 项目交付** | [PROJECT_DELIVERY.md](./project/project-management/PROJECT_DELIVERY.md), [DELIVERY.md](./project/project-management/DELIVERY.md) |

---

## 📅 最新更新

### 最近更新的文档

| 文档 | 类型 | 更新日期 | 说明 |
|------|------|---------|------|
| [LOGGING_SYSTEM_RELEASE.md](./backend/features/LOGGING_SYSTEM_RELEASE.md) | 功能 | 2025-11-11 | 日志管理系统 v1.1.0 |
| [CONTENT_MANAGEMENT_MODULE.md](./backend/features/CONTENT_MANAGEMENT_MODULE.md) | 功能 | 2025-11-07 | CMS 模块 v1.0.0 |
| [MARKDOWN_PARSER_INTEGRATION.md](./backend/features/MARKDOWN_PARSER_INTEGRATION.md) | 功能 | 2025-11-06 | Markdown 解析器 |
| [TOKEN_IMPLEMENTATION_SUMMARY.md](./backend/features/TOKEN_IMPLEMENTATION_SUMMARY.md) | 功能 | 2025-11-05 | Token 刷新和退出 |
| [CHANGELOG.md](./project/development/CHANGELOG.md) | 开发 | 2025-10-17 | 完整版本历史 |

---

## 📈 文档统计

- **总文档数**: 49 个
  - Backend 文档: 29 个
  - Project 文档: 19 个
  - Frontend 文档: 0 个（待添加）
  - 索引文档: 1 个

- **按类型统计**:
  - 架构设计: 6 个
  - 功能发布: 13 个
  - 使用指南: 6 个
  - 数据库迁移: 4 个
  - API 参考: 2 个
  - 项目设置: 5 个
  - 开发维护: 4 个
  - API 工具: 3 个
  - 项目管理: 4 个

---

## 🤝 贡献指南

### 添加新文档

1. **确定文档类型和位置**:
   - Backend 技术文档 → `docs/backend/`
   - Frontend 技术文档 → `docs/frontend/`
   - 项目级文档 → `docs/project/`

2. **选择合适的子目录**:
   - 架构设计 → `architecture/`
   - 功能发布 → `features/`
   - 使用指南 → `guides/`
   - 等等...

3. **使用规范的命名**:
   - 技术文档: 大写字母+下划线（如 `API_NAMING_CONVENTION.md`）
   - 指南文档: 大写字母+下划线或小写+连字符

4. **更新索引**:
   - 在对应的 README.md 中添加索引
   - 在本文件中更新统计信息

5. **提交变更**:
   ```bash
   git add docs/
   git commit -m "docs: 📝 添加 XXX 文档"
   ```

### 更新现有文档

1. 更新文档内容
2. 更新文档顶部的"最后更新"日期
3. 如有重大变更，更新版本号
4. 在 CHANGELOG.md 中记录变更
5. 提交时使用 `docs:` 前缀的 commit message

---

## 📖 文档模板

### 功能发布文档模板

```markdown
# [功能名称] 功能发布文档

**更新时间**: YYYY-MM-DD
**版本**: vX.Y.Z
**状态**: ✅ 已完成 / ⏳ 进行中 / 🔜 计划中

## 📋 更新概览
[简要说明]

## 🗄️ 数据库变更
[Schema 变更说明]

## 🔧 核心功能实现
[功能实现详情]

## 🌐 API 接口
[接口列表和说明]

## 🚀 部署步骤
[部署指南]

## 📊 使用场景
[实际使用示例]
```

### 使用指南文档模板

```markdown
# [模块名称] 使用指南

## 概述
[模块简介]

## 快速开始
[快速使用示例]

## API 接口
[接口详细说明]

## 使用场景
[常见场景示例]

## 常见问题
[FAQ]
```

---

## 🔗 相关资源

- **主 README**: [../../README.md](../README.md)
- **API 文档**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api/swagger/json
- **GitHub Issues**: [提交问题](https://github.com/myltx/nestBase/issues)

---

## 💡 使用建议

1. **从索引开始**: 每个目录都有 README.md 索引，先查看索引了解全局
2. **按角色阅读**: 根据你的角色选择对应的推荐阅读路径
3. **主题搜索**: 使用主题索引快速找到相关文档
4. **保持更新**: 文档会持续更新，关注"最新更新"章节

---

**文档维护**: NestBase Team
**最后更新**: 2025-11-11
**文档版本**: 2.0.0
