# 接口精简与优化分析报告 (Phase 2)

## 1. 背景与目标
这是 API 接口优化的第二阶段，覆盖 `Projects`、`Contents`、`Categories`、`Tags`、`Logs`、`Audit`、`System` 及 `Auth` 模块。
目标同第一阶段：**在不降低系统能力的前提下，最大限度精简接口数量**，统一设计风格。

---

## 2. 模块分析与优化建议

### 2.1 Tags（标签模块）

#### 现状与问题
*   **接口冗余**:
    *   `GET /tags/page`: 分页查询接口，与 `GET /tags` (findAll) 功能重叠。
    *   `GET /tags/popular`: 热门标签接口，本质是按特定排序规则（usage count）查询。
*   **批量操作独立**: `POST /tags/batch` 独立于创建接口。

#### 优化建议
1.  **合并查询接口**: 移除 `/tags/page` 和 `/tags/popular`。统一使用 `GET /tags`。
    *   增加查询参数: `?sort=popular` (热门), `?current=1&size=10` (分页)。
    *   如果未传分页参数，返回全量（适合下拉选择）；传了则分页。
2.  **标准化批量创建**: `POST /tags` 既支持单个对象，也支持对象数组（或者保留 `batch` 但建议前端统一调用方式）。考虑到 RESTful 语义，保持单数 `POST /tags` 最纯粹，批量可作为特殊 Payload 或保持现状。考虑到管理后台导入场景，**建议保留 /batch 但归类到 Import 功能**，或者通过重载 `POST` 支持数组。鉴于 NestJS DTO 校验方便，**推荐保持 batch 或支持数组**。为了极简，可以合并，但批量创建有时需要不同的返回格式（成功/失败数量）。**建议：** 暂时保留 `batch` 作为一个明确的功能点，或者合并但需复杂化 DTO。
    *   *推荐*: 移除 `GET /tags/page`, `GET /tags/popular` -> `GET /tags?sort=popular&page=1`。

#### 推荐接口设计
| 动作 | 原接口 | 优化后 | 备注 |
| :--- | :--- | :--- | :--- |
| 查询列表/分页 | GET /tags/page | GET /tags | 通过 `current/size` 区分是否分页 |
| 查询热门 | GET /tags/popular | GET /tags?sort=popular | 通过排序参数实现 |
| 创建 | POST /tags | POST /tags | 保持不变 |
| 批量创建 | POST /tags/batch | POST /tags/batch | 建议保留，明确语义 |
| 详情/更新/删除 | ... | ... | 保持不变 |

---

### 2.2 Logs & Audit（日志模块）

#### 现状与问题
*   **Logs 分类拆分**: `LogsController` 将访问日志和登录日志拆分为 `/logs/access` and `/logs/login` 及其各自的 stats 接口。
*   **Audit 独立**: `AuditController` 独立管理审计日志。
*   **统计接口独立**: `access/stats`, `login/stats`。

#### 优化建议
1.  **合并 Login/Access 日志**: 它们结构相似，都是系统日志。可以合并为 `GET /logs`，通过 `?type=ACCESS|LOGIN` 区分。
    *   **优点**: 前端日志组件可复用，只需切换 type 参数。
2.  **统计接口合并**: `GET /logs/stats?type=...`。
3.  **Audit 日志**: 审计日志通常结构较特殊（记录 diff），且业务含义重（操作审计 vs 系统流水），**建议保持 Audit 独立**，但 `AuditController` 接口已很精简，无需变动。

#### 推荐接口设计
| 动作 | 原接口 | 优化后 | 备注 |
| :--- | :--- | :--- | :--- |
| 访问日志列表 | GET /logs/access | GET /logs?type=ACCESS | 合并 |
| 登录日志列表 | GET /logs/login | GET /logs?type=LOGIN | 合并 |
| 访问日志统计 | GET /logs/access/stats | GET /logs/stats?type=ACCESS | 合并 |
| 登录日志统计 | GET /logs/login/stats | GET /logs/stats?type=LOGIN | 合并 |

---

### 2.3 Categories（分类模块）

#### 现状与问题
*   **列表结构拆分**: `GET /categories` (树形) vs `GET /categories/flat` (扁平)。
*   **Slug 查询独立**: `GET /categories/slug/:slug`。

#### 优化建议
1.  **合并列表接口**: 统一使用 `GET /categories`。
    *   增加参数 `?format=tree|flat` (默认 tree)。
2.  **移除 Slug 查询**: 用户确认目前该功能未使用。直接移除 `GET /categories/slug/:slug`。

#### 推荐接口设计
| 动作 | 原接口 | 优化后 | 备注 |
| :--- | :--- | :--- | :--- |
| 树形列表 | GET /categories | GET /categories | 默认返回 Tree |
| 扁平列表 | GET /categories/flat | GET /categories?format=flat | 参数控制 |
| Slug 查询 | GET /categories/slug/:slug | - | **移除** (未使用) |

---

### 2.4 Projects & Contents（内容类模块）

#### 现状与问题
*   **Action 接口**: 
    *   Projects: `getTechStack` (独立资源，OK).
    *   Contents: 目前主要是 CRUD。
*   **观察**: 内容管理通常会有 `publish`, `archive`, `feature` 等操作。目前 Controller 中主要是基础 CRUD。如果未来有这些需求，**严禁新增 `/contents/:id/publish` 接口**。
*   **优化预案**: 状态变更统一走 `PATCH /contents/:id`。

#### 推荐接口设计
*   **Projects**: 保持现状。`getTechStack` 是特定聚合，保留。
*   **Contents**: 保持现状，确保 `findOne` 的 `view` 参数逻辑清晰（目前已实现）。

---

### 2.5 Auth & System（基础模块）

#### 现状与问题
*   **System**: `GET /system/status` 很标准。
*   **Auth**: 
    *   `permissions` (获取用户权限): 独立接口。
    *   `profile`: 获取用户信息。
    *   *思考*: `profile` 是否应该包含 `permissions`？
    *   *场景*: 登录后初始化 Store，需要 UserInfo + Permissions + Menus。
    *   *建议*: 保持独立。因为 `Menus` 也是独立的，Permissions 也是独立的，Profile 也是独立的。合并虽然减少请求，但耦合度高。或者提供一个 `GET /auth/bootstrap` 聚合所有初始数据。
    *   *决策*: 目前 Auth 接口职责清晰，无需强制合并。

---

## 3. 总体调整汇总表

| 模块 | 调整项 | 涉及接口数 (减) | 说明 |
| :--- | :--- | :--- | :--- |
| **Tags** | 合并 Page/Popular | -2 | 统一至 `findAll` |
| **Logs** | 合并 Access/Login | -2 | 统一至 `findAll` + type |
| **Logs** | 合并 Stats | -1 | 统一至 `stats` + type |
| **Categories** | 合并 Flat/Tree | -1 | 统一至 `findAll` + format |
| **Categories** | 移除 Slug 独立接口 | -1 | 统一至 `findAll` + slug query |

**预计总减少接口数量: ~7 个**

## 4. 代码调整建议

1.  **TagsService**: 
    *   重构 `findAll` 支持 `QueryTagDto` (包含 page, size, sort, search)。
2.  **LogsService**:
    *   创建通用 `findAll(type, query)` 方法。
    *   创建通用 `getStats(type, ...)` 方法。
3.  **CategoriesService**:
    *   `findAll` 增加 `format` 参数处理。
