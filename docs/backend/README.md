# NestBase 后端文档中心

> 📚 **文档版本**: v1.0.0
> 📅 **最后更新**: 2025-11-11
> 🏗️ **项目**: NestBase Backend API

---

## 📂 文档目录结构

```
docs/
├── README.md                    # 文档索引（本文件）
├── architecture/                # 架构设计文档
├── features/                    # 功能发布文档
├── guides/                      # 使用指南
├── migrations/                  # 数据库迁移文档
└── api/                        # API 参考文档
```

---

## 🏛️ 架构设计 (`architecture/`)

系统架构、设计规范和技术决策文档。

| 文档 | 说明 | 重要程度 |
|------|------|---------|
| [API_NAMING_CONVENTION.md](./architecture/API_NAMING_CONVENTION.md) | API 命名规范（camelCase vs snake_case） | ⭐⭐⭐⭐⭐ |
| [NAMING_CONVENTION_CONCLUSION.md](./architecture/NAMING_CONVENTION_CONCLUSION.md) | 命名规范最终结论 | ⭐⭐⭐⭐⭐ |
| [BUSINESS_CODES.md](./architecture/BUSINESS_CODES.md) | 业务状态码说明 | ⭐⭐⭐⭐⭐ |
| [BUSINESS_CODES_IMPLEMENTATION.md](./architecture/BUSINESS_CODES_IMPLEMENTATION.md) | 业务状态码实现详解 | ⭐⭐⭐⭐ |
| [VALIDATION_PIPE_CONFIG.md](./architecture/VALIDATION_PIPE_CONFIG.md) | 全局验证管道配置 | ⭐⭐⭐⭐ |
| [REDIS_ANALYSIS.md](./architecture/REDIS_ANALYSIS.md) | Redis 集成方案分析 | ⭐⭐⭐ |

**适用人群**: 架构师、技术负责人、新加入的开发人员

---

## ✨ 功能发布 (`features/`)

新功能的完整发布文档，包括设计、实现和使用说明。

### 核心功能

| 文档 | 功能 | 版本 | 发布日期 |
|------|------|------|---------|
| [LOGGING_SYSTEM_RELEASE.md](./features/LOGGING_SYSTEM_RELEASE.md) | 日志管理系统 | v1.1.0 | 2025-11-11 |
| [CONTENT_MANAGEMENT_MODULE.md](./features/CONTENT_MANAGEMENT_MODULE.md) | CMS 内容管理模块 | v1.0.0 | 2025-11-07 |
| [MARKDOWN_PARSER_INTEGRATION.md](./features/MARKDOWN_PARSER_INTEGRATION.md) | Markdown 解析器集成 | v1.0.0 | 2025-11-06 |
| [NEW_PERMISSION_SYSTEM.md](./features/NEW_PERMISSION_SYSTEM.md) | 权限管理系统 | v1.0.0 | - |
| [TOKEN_IMPLEMENTATION_SUMMARY.md](./features/TOKEN_IMPLEMENTATION_SUMMARY.md) | Token 刷新和退出登录 | v1.0.0 | 2025-11-05 |
| [TOKEN_REFRESH_LOGOUT.md](./features/TOKEN_REFRESH_LOGOUT.md) | Token 刷新实现详解 | v1.0.0 | - |

### 功能更新

| 文档 | 说明 | 日期 |
|------|------|------|
| [ROLE_MIGRATION.md](./features/ROLE_MIGRATION.md) | 角色系统从枚举到数据库的迁移 | - |
| [CHANGELOG_USER_ROLES.md](./features/CHANGELOG_USER_ROLES.md) | 用户角色功能更新日志 | - |
| [REFACTOR_USER_ROLES_INTEGRATION.md](./features/REFACTOR_USER_ROLES_INTEGRATION.md) | 用户角色重构说明 | - |
| [ROLE_HOME_PAGE.md](./features/ROLE_HOME_PAGE.md) | 角色首页功能 | - |
| [ROLE_RESTRICTIONS.md](./features/ROLE_RESTRICTIONS.md) | 角色权限限制 | - |

**适用人群**: 产品经理、开发人员、测试人员

---

## 📖 使用指南 (`guides/`)

功能使用说明、API 使用指南和模块文档。

### 模块使用指南

| 文档 | 模块 | 说明 |
|------|------|------|
| [CMS_API_GUIDE.md](./guides/CMS_API_GUIDE.md) | CMS | 内容管理系统 API 完整使用指南 |
| [MENU_MANAGEMENT.md](./guides/MENU_MANAGEMENT.md) | 菜单管理 | 菜单 CRUD、树形结构、角色关联 |
| [API_USER_ROLES.md](./guides/API_USER_ROLES.md) | 用户角色 | 用户角色 API 使用指南 |
| [AUDIT_USAGE.md](./guides/AUDIT_USAGE.md) | 审计日志 | 审计日志使用和查询 |
| [users-module.md](./guides/users-module.md) | 用户模块 | 用户管理功能说明 |
| [projects-module.md](./guides/projects-module.md) | 项目模块 | 项目管理功能说明 |

**适用人群**: 前端开发人员、API 使用者、测试人员

---

## 🔄 数据库迁移 (`migrations/`)

数据库 Schema 变更记录和迁移指南。

| 文档 | 说明 | 影响范围 |
|------|------|---------|
| [MIGRATION_GUIDE.md](./migrations/MIGRATION_GUIDE.md) | 数据库迁移完整指南 | 全局 |
| [MIGRATION_ADD_ICON_TYPE.md](./migrations/MIGRATION_ADD_ICON_TYPE.md) | 添加图标类型字段 | Menu 表 |
| [MIGRATION_REMOVE_TITLE_FIELD.md](./migrations/MIGRATION_REMOVE_TITLE_FIELD.md) | 移除 title 字段 | Menu 表 |
| [PARENT_ID_IMMUTABLE.md](./migrations/PARENT_ID_IMMUTABLE.md) | parentId 字段不可变限制 | Menu 表 |

**适用人群**: 数据库管理员、后端开发人员

---

## 🔌 API 参考 (`api/`)

API 接口定义、修复记录和技术参考。

| 文档 | 说明 | 状态 |
|------|------|------|
| [CREATE_MENU_DTO_FIX.md](./api/CREATE_MENU_DTO_FIX.md) | 菜单创建 DTO 修复记录 | 已完成 |
| [CREATE_MENU_WITH_PERMISSIONS.md](./api/CREATE_MENU_WITH_PERMISSIONS.md) | 带权限的菜单创建 | 已完成 |

**适用人群**: API 开发人员、接口维护人员

---

## 🚀 快速开始

### 新开发人员入门

1. **架构了解**:
   - [API_NAMING_CONVENTION.md](./architecture/API_NAMING_CONVENTION.md) - 了解命名规范
   - [BUSINESS_CODES.md](./architecture/BUSINESS_CODES.md) - 了解业务状态码

2. **功能学习**:
   - [CMS_API_GUIDE.md](./guides/CMS_API_GUIDE.md) - CMS 系统使用
   - [MENU_MANAGEMENT.md](./guides/MENU_MANAGEMENT.md) - 菜单管理

3. **数据库操作**:
   - [MIGRATION_GUIDE.md](./migrations/MIGRATION_GUIDE.md) - 迁移指南

### 按角色查看

#### 🏗️ 架构师 / 技术负责人
推荐阅读：
- `architecture/` 目录下所有文档
- `features/` 目录下的功能发布文档

#### 💻 后端开发人员
推荐阅读：
- `architecture/API_NAMING_CONVENTION.md`
- `architecture/BUSINESS_CODES.md`
- `guides/` 目录下所有文档
- `migrations/` 目录下所有文档

#### 🎨 前端开发人员
推荐阅读：
- `guides/CMS_API_GUIDE.md`
- `guides/API_USER_ROLES.md`
- `guides/MENU_MANAGEMENT.md`
- `architecture/BUSINESS_CODES.md`

#### 🧪 测试人员
推荐阅读：
- `guides/` 目录下所有文档
- `features/` 目录下的功能发布文档

---

## 📝 文档编写规范

### 文档命名

- **架构文档**: 大写字母+下划线，如 `API_NAMING_CONVENTION.md`
- **功能文档**: 大写字母+下划线，如 `LOGGING_SYSTEM_RELEASE.md`
- **指南文档**: 大写字母+下划线或小写字母+连字符，如 `CMS_API_GUIDE.md` 或 `users-module.md`
- **迁移文档**: `MIGRATION_` 前缀，如 `MIGRATION_ADD_ICON_TYPE.md`

### 文档模板

#### 功能发布文档模板

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

#### 使用指南文档模板

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

## 🔍 文档搜索

### 按主题查找

| 主题 | 相关文档 |
|------|---------|
| **命名规范** | `architecture/API_NAMING_CONVENTION.md`, `architecture/NAMING_CONVENTION_CONCLUSION.md` |
| **错误处理** | `architecture/BUSINESS_CODES.md`, `architecture/BUSINESS_CODES_IMPLEMENTATION.md` |
| **认证授权** | `features/TOKEN_*.md`, `guides/API_USER_ROLES.md` |
| **日志系统** | `features/LOGGING_SYSTEM_RELEASE.md`, `guides/AUDIT_USAGE.md` |
| **内容管理** | `features/CONTENT_MANAGEMENT_MODULE.md`, `guides/CMS_API_GUIDE.md` |
| **菜单管理** | `guides/MENU_MANAGEMENT.md`, `api/CREATE_MENU_*.md` |
| **数据库** | `migrations/` 目录下所有文档 |

### 按时间查找

最新文档（按创建/更新日期排序）：
1. `features/LOGGING_SYSTEM_RELEASE.md` - 2025-11-11
2. `features/CONTENT_MANAGEMENT_MODULE.md` - 2025-11-07
3. `features/MARKDOWN_PARSER_INTEGRATION.md` - 2025-11-06
4. `features/TOKEN_IMPLEMENTATION_SUMMARY.md` - 2025-11-05

---

## 📈 文档统计

- **总文档数**: 28 个
- **架构文档**: 6 个
- **功能文档**: 8 个
- **使用指南**: 6 个
- **迁移文档**: 4 个
- **API 参考**: 2 个
- **索引文档**: 1 个

---

## 🤝 贡献指南

### 添加新文档

1. 确定文档类型，选择合适的目录
2. 使用规范的文档模板
3. 在本 README.md 中添加索引
4. 提交时使用 `docs:` 前缀的 commit message

### 更新现有文档

1. 更新文档内容
2. 更新文档顶部的"最后更新"日期
3. 如有重大变更，更新版本号
4. 提交时说明更新内容

---

## 📞 联系方式

- **项目维护者**: NestBase Team
- **技术支持**: [GitHub Issues](https://github.com/your-org/nestbase/issues)
- **文档反馈**: 请提交 Issue 或 PR

---

**文档维护**: Claude Code
**最后更新**: 2025-11-11
**文档版本**: 1.0.0
