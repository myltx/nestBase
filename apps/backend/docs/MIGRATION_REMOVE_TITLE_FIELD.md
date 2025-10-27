# 数据库迁移指南 - 移除 title 字段

## 📋 变更概述

本次迁移主要包含以下变更：

### 1. Menu 表变更
- **移除字段**: `title` - 菜单标题（与 `menuName` 重复）
- **保留字段**: `menuName` - 菜单名称（作为唯一的菜单显示名称）

### 2. 业务逻辑变更
- **新增验证**: 目录类型菜单（menuType=1）不能有父菜单（parentId 必须为 null）
- 更新所有引用 `title` 字段的代码为 `menuName`

---

## 🚀 执行迁移步骤

### 方式一：使用 SQL 手动迁移（推荐）

```sql
-- 1. 如果需要保留 title 数据，先备份到 menuName（如果 menuName 为空）
UPDATE "menus"
SET "menu_name" = "title"
WHERE "menu_name" = '' OR "menu_name" IS NULL;

-- 2. 删除 title 字段
ALTER TABLE "menus"
DROP COLUMN IF EXISTS "title";
```

### 方式二：使用 Prisma db push（会丢失数据）

⚠️ **警告**: 此方法会丢失所有数据！

```bash
cd apps/backend
npx prisma db push --force-reset
pnpm seed  # 重新填充测试数据
```

---

## ⚠️ 迁移前注意事项

### 1. 备份数据库

```bash
# 备份当前数据库
pg_dump -h your-host -U your-user -d your-db > backup_remove_title.sql
```

### 2. 数据迁移策略

由于 `title` 和 `menuName` 是重复字段，迁移策略：

```sql
-- 检查是否有 menuName 为空但 title 有值的记录
SELECT id, "route_name", "menu_name", "title"
FROM "menus"
WHERE ("menu_name" = '' OR "menu_name" IS NULL) AND "title" IS NOT NULL;

-- 如果有，先同步数据
UPDATE "menus"
SET "menu_name" = "title"
WHERE ("menu_name" = '' OR "menu_name" IS NULL) AND "title" IS NOT NULL;
```

### 3. 验证目录类型菜单

```sql
-- 检查是否有 menuType=1 但 parentId 不为 null 的记录
SELECT id, "route_name", "menu_name", "menu_type", "parent_id"
FROM "menus"
WHERE "menu_type" = 1 AND "parent_id" IS NOT NULL;

-- 如果有，需要手动处理：
-- 选项1：将这些菜单改为 menuType=2（普通菜单）
UPDATE "menus"
SET "menu_type" = 2
WHERE "menu_type" = 1 AND "parent_id" IS NOT NULL;

-- 选项2：清除 parentId（将它们变为顶级目录）
UPDATE "menus"
SET "parent_id" = NULL
WHERE "menu_type" = 1 AND "parent_id" IS NOT NULL;
```

---

## ✅ 迁移后验证

### 1. 检查表结构

```sql
-- 查看 menus 表结构
\d menus

-- 确认：
-- - 无 title 字段
-- - 有 menu_name 字段
```

### 2. 验证数据

```sql
-- 查看所有菜单的 menuName
SELECT id, "route_name", "menu_name", "menu_type", "parent_id"
FROM "menus"
ORDER BY "order";

-- 确认没有空的 menu_name
SELECT COUNT(*)
FROM "menus"
WHERE "menu_name" = '' OR "menu_name" IS NULL;

-- 确认目录类型菜单都没有父菜单
SELECT COUNT(*)
FROM "menus"
WHERE "menu_type" = 1 AND "parent_id" IS NOT NULL;
-- 结果应该为 0
```

### 3. 测试应用

```bash
# 重新生成 Prisma Client
npx prisma generate

# 运行类型检查
npx tsc --noEmit

# 启动应用测试
pnpm dev
```

---

## 🔄 回滚方案

如果需要回滚：

```sql
-- 1. 重新添加 title 字段
ALTER TABLE "menus"
ADD COLUMN "title" TEXT;

-- 2. 从 menu_name 复制数据到 title
UPDATE "menus"
SET "title" = "menu_name";

-- 3. 设置 title 为 NOT NULL
ALTER TABLE "menus"
ALTER COLUMN "title" SET NOT NULL;
```

---

## 📊 代码变更摘要

### 1. Schema 变更
**文件**: `prisma/schema.prisma`

```diff
model Menu {
  routeName       String       @unique @map("route_name")
  routePath       String       @map("route_path")
  menuName        String       @default("") @map("menu_name")
- title           String
  i18nKey         String?      @map("i18n_key")
  // ...
}
```

### 2. DTO 变更
**文件**: `src/modules/menus/dto/create-menu.dto.ts`

```diff
export class CreateMenuDto {
  @IsString()
  menuName: string;

- @IsString()
- title: string;

  // ...
}
```

### 3. Service 变更
**文件**: `src/modules/menus/menus.service.ts`

```diff
private readonly menuSelect = {
  id: true,
  routeName: true,
  menuName: true,
- title: true,
  // ...
};

// 搜索逻辑更新
if (search) {
  where.OR = [
-   { title: { contains: search } },
+   { menuName: { contains: search } },
    { routeName: { contains: search } },
  ];
}

// 新增验证逻辑
async create(createMenuDto: CreateMenuDto) {
+ // 验证：目录类型（menuType=1）不能有父菜单
+ if (menuType === 1 && parentId) {
+   throw new BadRequestException('目录类���菜单不能设置父菜单');
+ }
  // ...
}
```

### 4. 其他服务变更
**文件**:
- `src/modules/permissions/permissions.service.ts` (2处)
- `src/modules/roles/roles.service.ts` (1处)

所有引用 `menu.title` 的地方都改为 `menu.menuName`

---

## 🆘 常见问题

### Q1: 为什么要删除 title 字段？
**A**: `title` 和 `menuName` 是重复字段，都用于显示菜单名称。保留一个可以简化数据模型，减少混淆。

### Q2: 为什么选择保留 menuName 而不是 title？
**A**:
1. `menuName` 更符合语义（菜单名称 vs 标题）
2. 数据库字段名为 `menu_name`，更清晰
3. 与 `routeName` 命名风格一致

### Q3: 目录类型不能有父菜单的原因？
**A**: 目录（menuType=1）是顶级容器，用于组织菜单层级结构。它本身应该是顶层的，不应该嵌套在其他菜单下。只有普通菜单（menuType=2）才应该有父菜单。

### Q4: 现有数据如何处理？
**A**:
1. 如果 `menuName` 为空，从 `title` 复制数据
2. 如果��� menuType=1 且 parentId 不为空的记录，需要手动决定：
   - 改为 menuType=2（普通菜单）
   - 或清除 parentId（变为顶级目录）

---

**迁移日期**: 2025-10-27
**影响范围**: Menu 表结构、菜单相关 DTO、Service、Controller
**兼容性**: 不兼容旧 API（需要客户端同步更新）
