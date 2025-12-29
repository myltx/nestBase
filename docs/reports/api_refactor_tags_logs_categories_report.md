# API 简化与重构验证报告 (Phase 2)

## 1. 改动概述
第二阶段重构针对 `Tags`, `Logs`, `Categories` 模块进行了接口精简和优化，重点在于合并重复查询接口和规范化参数设计。

## 2. 详细改动

### Tags 模块 (标签)
*   **统一查询接口**: 移除 `/tags/page` 和 `/tags/popular`，统一合并至 `GET /tags`。
    *   **普通查询**: `GET /tags` (返回全量或默认列表)
    *   **分页/搜索**: `GET /tags?current=1&size=10&search=keyword`
    *   **热门/排序**: `GET /tags?sort=popular&limit=10` (配合 size 使用)
*   **DTO 调整**: `QueryTagDto` 新增 `sort` 参数。

### Logs 模块 (日志)
*   **统一日志查询**: 移除独立的 `/logs/access` 和 `/logs/login` 接口，统一合并至 `GET /logs`。
    *   **查询访问日志**: `GET /logs?type=ACCESS` (默认)
    *   **查询登录日志**: `GET /logs?type=LOGIN`
    *   **DTO 统一**: 创建 `QueryLogDto` 统一处理参数。
*   **统一统计接口**: 合并统计接口至 `GET /logs/stats?type=ACCESS|LOGIN`。

### Categories 模块 (分类)
*   **统一列表查询**: 移除 `/categories/flat`，统一合并至 `GET /categories`。
    *   **树形结构**: `GET /categories` (或 `?format=tree`)
    *   **扁平结构**: `GET /categories?format=flat`
*   **移除冗余接口**: 移除 `GET /categories/slug/:slug` (确认未使用)。

## 3. 验证结果
*   **编译检查**: 运行 `npm run build` 通过，无类型错误。
*   **依赖清理**: 代码逻辑已适配新接口签名。

## 4. 前端适配建议
前端代码需同步更新 API 调用：
*   所有标签查询统一调用 `/tags`，根据需要传参。
*   日志页面需统一调用 `/logs`，通过 `type` 区分 Tabs。
*   分类选择器若需要扁平数据，调用 `/categories?format=flat`。
