# NestBase 项目文档索引

> 📚 **文档版本**: v1.0.0
> 📅 **最后更新**: 2025-11-11
> 🏗️ **项目**: NestBase - NestJS Backend Monorepo

---

## 📂 根目录文档结构

本目录包含项目根目录下的所有配置、开发、功能和管理文档。

```
docs/root-docs/
├── README.md                    # 本文件
├── setup/                       # 项目设置和配置
├── development/                 # 开发和维护
├── features/                    # 功能实现和迁移
├── api-tools/                   # API 工具和集成
└── project-management/          # 项目管理和交付
```

---

## 🛠️ 项目设置和配置 (`setup/`)

快速开始和环境配置相关文档。

| 文档                                                 | 说明                     | 重要程度   |
| ---------------------------------------------------- | ------------------------ | ---------- |
| [QUICKSTART.md](./setup/QUICKSTART.md)               | 快速开始指南（4步启动）  | ⭐⭐⭐⭐⭐ |
| [SUPABASE_SETUP.md](./setup/SUPABASE_SETUP.md)       | Supabase 数据库配置详解  | ⭐⭐⭐⭐⭐ |
| [CLAUDE.md](./setup/CLAUDE.md)                       | Claude Code 开发环境配置 | ⭐⭐⭐⭐   |
| [MONOREPO.md](./setup/MONOREPO.md)                   | Monorepo 架构说明        | ⭐⭐⭐⭐   |
| [DEPLOYMENT_GUIDE.md](../guides/DEPLOYMENT_GUIDE.md) | 生产环境部署指南         | ⭐⭐⭐⭐⭐ |
| [AGENTS.md](./setup/AGENTS.md)                       | 代码规范和开发指南       | ⭐⭐⭐     |

**适用人群**: 新开发人员、环境配置人员

---

## 💻 开发和维护 (`development/`)

开发过程中的变更记录和维护文档。

| 文档                                                               | 说明               | 最后更新   |
| ------------------------------------------------------------------ | ------------------ | ---------- |
| [CHANGELOG.md](./development/CHANGELOG.md)                         | 完整版本更新日志   | 2025-10-17 |
| [CODE_CHECK_REPORT.md](./development/CODE_CHECK_REPORT.md)         | 代码检查和修复报告 | 2025-01-15 |
| [DOCUMENTATION_UPDATE.md](./development/DOCUMENTATION_UPDATE.md)   | 文档更新记录       | 2025-10-15 |
| [DOCS_UPDATE_CHECKLIST.md](./development/DOCS_UPDATE_CHECKLIST.md) | 文档更新检查清单   | 2025-10-16 |

**适用人群**: 所有开发人员、维护人员

---

## ✨ 功能实现和迁移 (`features/`)

主要功能的实现方案和系统级设计文档。

| 文档                                            | 功能                                  | 状态        |
| ----------------------------------------------- | ------------------------------------- | ----------- |
| [RBAC_GUIDE.md](./features/RBAC_GUIDE.md)       | RBAC 权限系统完整使用指南（含前后端） | ✅ 已完成   |
| [RBAC_REDESIGN.md](./features/RBAC_REDESIGN.md) | RBAC 权限系统架构重新设计方案         | 📋 设计文档 |

**适用人群**: 架构师、技术负责人

**注意**: 具体的后端实现和迁移文档请查看 [Backend Features](../backend/features/)

---

## 🔌 API 工具和集成 (`api-tools/`)

API 文档导出、工具集成相关文档。

| 文档                                                               | 说明                         | 用途     |
| ------------------------------------------------------------------ | ---------------------------- | -------- |
| [APIFOX_IMPORT_GUIDE.md](./api-tools/APIFOX_IMPORT_GUIDE.md)       | Apifox 自动导入 API 文档指南 | 导入工具 |
| [OPENAPI_IMPLEMENTATION.md](./api-tools/OPENAPI_IMPLEMENTATION.md) | OpenAPI 文档导出实现说明     | 技术实现 |
| [OPENAPI_UPDATE_SUMMARY.md](./api-tools/OPENAPI_UPDATE_SUMMARY.md) | OpenAPI 功能更新总结         | 更新记录 |

**适用人群**: API 使用者、前端开发人员、测试人员

---

## 📊 项目管理和交付 (`project-management/`)

项目交付、总结和管理相关文档。

| 文档                                                            | 说明             | 日期       |
| --------------------------------------------------------------- | ---------------- | ---------- |
| [PROJECT_DELIVERY.md](./project-management/PROJECT_DELIVERY.md) | 项目交付完整报告 | 2025-10-15 |
| [DELIVERY.md](./project-management/DELIVERY.md)                 | 项目交付清单     | 2025-10-15 |
| [PROJECT_SUMMARY.md](./project-management/PROJECT_SUMMARY.md)   | 项目技术总结     | 2025-10-15 |
| [FILE_LIST.md](./project-management/FILE_LIST.md)               | 项目文件列表     | 2025-10-15 |

**适用人群**: 项目经理、技术负责人

---

## 🚀 快速开始

### 新开发人员入门路径

1. **环境配置** (必读)
   - [QUICKSTART.md](./setup/QUICKSTART.md) - 4步快速启动
   - [SUPABASE_SETUP.md](./setup/SUPABASE_SETUP.md) - 数据库配置

2. **了解架构**
   - [MONOREPO.md](./setup/MONOREPO.md) - 项目结构
   - [CLAUDE.md](./setup/CLAUDE.md) - 开发环境

3. **开发规范**
   - [AGENTS.md](./setup/AGENTS.md) - 代码规范
   - [CHANGELOG.md](./development/CHANGELOG.md) - 变更历史

4. **核心功能**
   - [RBAC_GUIDE.md](./features/RBAC_GUIDE.md) - 权限系统

### API 使用者快速入门

1. **导入 API 文档**
   - [APIFOX_IMPORT_GUIDE.md](./api-tools/APIFOX_IMPORT_GUIDE.md)

2. **查看接口定义**
   - 访问 `http://localhost:3000/api-docs`
   - 或导入 `http://localhost:3000/api/swagger/json`

### 按角色查看

#### 🏗️ 架构师 / 技术负责人

推荐阅读：

- `setup/` 目录 - 了解项目架构
- `features/` 目录 - 核心功能设计
- `project-management/PROJECT_DELIVERY.md` - 项目交付报告

#### 💻 后端开发人员

推荐阅读：

- `setup/QUICKSTART.md` - 快速启动
- `setup/AGENTS.md` - 开发规范
- `features/RBAC_GUIDE.md` - 权限系统
- `development/CHANGELOG.md` - 版本历史

#### 🎨 前端开发人员

推荐阅读：

- `api-tools/APIFOX_IMPORT_GUIDE.md` - API 导入
- `features/RBAC_GUIDE.md` - 前端权限控制

#### 📦 DevOps / 运维人员

推荐阅读：

- `setup/SUPABASE_SETUP.md` - 数据库配置
- `setup/MONOREPO.md` - 部署架构

---

## 🔍 文档搜索

### 按主题查找

| 主题           | 相关文档                                                                            |
| -------------- | ----------------------------------------------------------------------------------- |
| **快速开始**   | `setup/QUICKSTART.md`, `setup/CLAUDE.md`                                            |
| **数据库配置** | `setup/SUPABASE_SETUP.md`                                                           |
| **权限系统**   | `features/RBAC_GUIDE.md`, `features/RBAC_REDESIGN.md`, `features/ROLE_MIGRATION.md` |
| **API 工具**   | `api-tools/APIFOX_IMPORT_GUIDE.md`, `api-tools/OPENAPI_*.md`                        |
| **版本历史**   | `development/CHANGELOG.md`                                                          |
| **项目交付**   | `project-management/PROJECT_DELIVERY.md`, `project-management/DELIVERY.md`          |

### 按时间查找

最新文档（按更新日期排序）：

1. `development/CHANGELOG.md` - 2025-10-17
2. `development/DOCS_UPDATE_CHECKLIST.md` - 2025-10-16
3. `development/DOCUMENTATION_UPDATE.md` - 2025-10-15
4. `project-management/PROJECT_DELIVERY.md` - 2025-10-15

---

## 📈 文档统计

- **总文档数**: 18 个
- **设置配置**: 5 个
- **开发维护**: 4 个
- **功能实现**: 3 个
- **API 工具**: 3 个
- **项目管理**: 4 个

---

## 📖 相关文档

### Backend 模块文档

在 `apps/backend/docs/` 目录下还有更详细的后端模块文档：

- **架构设计** (`architecture/`) - API 规范、业务状态码等
- **功能发布** (`features/`) - 日志系统、CMS、Token 等
- **使用指南** (`guides/`) - CMS API、菜单管理、用户角色等
- **数据库迁移** (`migrations/`) - Schema 变更记录
- **API 参考** (`api/`) - 接口修复记录

详见：[apps/backend/docs/README.md](../../apps/backend/docs/README.md)

---

## 🤝 贡献指南

### 添加新文档

1. 确定文档类型，选择合适的子目录
2. 使用清晰的文件命名（大写字母+下划线）
3. 在本 README.md 中添加索引
4. 提交时使用 `docs:` 前缀的 commit message

### 更新现有文档

1. 更新文档内容
2. 更新文档顶部的"最后更新"日期
3. 如有重大变更，在 CHANGELOG.md 中记录
4. 提交时说明更新内容

---

## 📝 文档命名规范

- **配置文档**: `*_SETUP.md`, `*_CONFIG.md`
- **指南文档**: `*_GUIDE.md`, `QUICKSTART.md`
- **设计文档**: `*_REDESIGN.md`, `*_IMPLEMENTATION.md`
- **迁移文档**: `*_MIGRATION.md`
- **总结文档**: `*_SUMMARY.md`, `*_DELIVERY.md`
- **更新文档**: `CHANGELOG.md`, `*_UPDATE.md`

---

## 📞 相关资源

- **主 README**: [../../README.md](../../README.md)
- **Backend 文档**: [../../apps/backend/docs/README.md](../../apps/backend/docs/README.md)
- **API 文档**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api/swagger/json

---

**文档维护**: NestBase Team
**最后更新**: 2025-11-11
**文档版本**: 1.0.0
