# 基础数据模块 (Basic Data Module) 实现记录

## 1. 概述
本次更新实现了 **基础数据模块 (Dictionaries Module)**，用于管理系统中的动态参数和枚举值（如用户性别、订单状态等）。

## 2. 核心功能
已实现以下功能：
- **字典管理 (Dictionaries)**:
    - 列表查询 (支持搜索、分页)
    - 详情获取 (包含字典项)
    - 根据编码查询 (Frontend Config)
    - 创建/更新/删除 (Admin Only)
- **字典项管理 (Dictionary Items)**:
    - 列表查询
    - 添加/更新/删除/排序 (Admin Only)

## 3. 数据库变更
修改了 `prisma/schema.prisma`，新增了两个模型：
- `Dictionary`: 存储字典元数据 (code, name, description)
- `DictionaryItem`: 存储具体选项 (label, value, sort, color)
同时修正了 `ErrorLevel` 枚举，补充了 `EMAIL` 和 `OTHER` 类型。

## 4. API 接口概览
### Dictionaries
- `GET /api/dictionaries`: 查询列表
- `GET /api/dictionaries/code/:code`: 按编码查询 (公开)
- `POST /api/dictionaries`: 创建
- `PATCH /api/dictionaries/:id`: 更新
- `DELETE /api/dictionaries/:id`: 删除

### Dictionary Items
- `GET /api/dictionaries/:id/items`: 获取项列表
- `POST /api/dictionaries/:id/items`: 添加项
- `PATCH /api/dictionaries/:id/items/:itemId`: 更新项
- `DELETE /api/dictionaries/:id/items/:itemId`: 删除项

## 5. 验证结果
- `pnpm prisma:generate` 成功执行。
- `pnpm build` 编译通过。
