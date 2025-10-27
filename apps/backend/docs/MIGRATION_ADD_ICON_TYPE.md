# 数据库迁移指南 - 添加 iconType 字段

## 📋 变更概述

本次迁移为 Menu 表添加 `iconType` 字段，用于区分图标类型。

### Menu 表变更
- **新增字段**: `iconType` (icon_type) - 图标类型
  - 类型: `Int`
  - 可选: `true`
  - 默认值: `1`
  - 取值:
    - `1` - Iconify 图标（使用 `icon` 字段）
    - `2` - 本地图标（使用 `localIcon` 字段）

- **字段确认**: `query` - 查询参数 JSON
  - 已经是可选字段 (`Json?`)，无需修改

---

## 🚀 执行迁移步骤

### 方式一：使用 SQL 手动迁移（推荐）

```sql
-- 1. 添加 iconType 字段，默认值为 1（Iconify 图标）
ALTER TABLE "menus"
ADD COLUMN "icon_type" INTEGER DEFAULT 1;

-- 2. （可选）根据现有数据智能设置 iconType
-- 如果菜单有 localIcon 但没有 icon，设置为本地图标
UPDATE "menus"
SET "icon_type" = 2
WHERE "local_icon" IS NOT NULL
  AND "local_icon" != ''
  AND ("icon" IS NULL OR "icon" = '');

-- 如果菜单有 icon，确保设置为 Iconify 图标
UPDATE "menus"
SET "icon_type" = 1
WHERE "icon" IS NOT NULL AND "icon" != '';
```

### 方式二：使用 Prisma db push

```bash
cd apps/backend
npx prisma db push
```

---

## ⚠️ 迁移前注意事项

### 1. 备份数据库

```bash
# 备份当前数据库
pg_dump -h your-host -U your-user -d your-db > backup_add_icon_type.sql
```

### 2. 检查现有图标数据

```sql
-- 查看使用 Iconify 图标的菜单
SELECT id, "route_name", "menu_name", "icon"
FROM "menus"
WHERE "icon" IS NOT NULL AND "icon" != '';

-- 查看使用本地图标的菜单
SELECT id, "route_name", "menu_name", "local_icon"
FROM "menus"
WHERE "local_icon" IS NOT NULL AND "local_icon" != '';

-- 查看同时有两种图标的菜单（需要决定默认使用哪个）
SELECT id, "route_name", "menu_name", "icon", "local_icon"
FROM "menus"
WHERE ("icon" IS NOT NULL AND "icon" != '')
  AND ("local_icon" IS NOT NULL AND "local_icon" != '');
```

---

## ✅ 迁移后验证

### 1. 检查表结构

```sql
-- 查看 menus 表结构
\d menus

-- 确认：
-- - 有 icon_type 字段
-- - 类型为 INTEGER
-- - 默认值为 1
```

### 2. 验证数据

```sql
-- 查看 iconType 分布
SELECT
  "icon_type",
  COUNT(*) as count,
  CASE
    WHEN "icon_type" = 1 THEN 'Iconify图标'
    WHEN "icon_type" = 2 THEN '本地图标'
    ELSE '未知'
  END as type_name
FROM "menus"
GROUP BY "icon_type";

-- 查看所有菜单的图标配置
SELECT
  id,
  "route_name",
  "menu_name",
  "icon_type",
  "icon",
  "local_icon"
FROM "menus"
ORDER BY "order";

-- 验证逻辑一致性
-- iconType=1 的应该有 icon 字段
SELECT id, "route_name", "menu_name"
FROM "menus"
WHERE "icon_type" = 1
  AND ("icon" IS NULL OR "icon" = '');

-- iconType=2 的应该有 localIcon 字段
SELECT id, "route_name", "menu_name"
FROM "menus"
WHERE "icon_type" = 2
  AND ("local_icon" IS NULL OR "local_icon" = '');
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
-- 删除 iconType 字段
ALTER TABLE "menus"
DROP COLUMN IF EXISTS "icon_type";
```

---

## 📊 代码变更摘要

### 1. Schema 变更
**文件**: `prisma/schema.prisma`

```diff
model Menu {
  menuName        String       @default("") @map("menu_name")
  i18nKey         String?      @map("i18n_key")
+ iconType        Int?         @default(1) @map("icon_type") // 图标类型 (1:iconify图标 2:本地图标)
  icon            String?
  localIcon       String?      @map("local_icon")
  // ...
  query           Json? // 已经是可选的
}
```

### 2. DTO 变更
**文件**: `src/modules/menus/dto/create-menu.dto.ts`

```diff
export class CreateMenuDto {
  @IsOptional()
  @IsString()
  i18nKey?: string;

+ @ApiPropertyOptional({
+   description: '图标类型 (1:iconify图标 2:本地图标)',
+   example: 1,
+ })
+ @IsOptional()
+ @IsInt()
+ @Min(1)
+ @Max(2)
+ iconType?: number;

  @IsOptional()
  @IsString()
  icon?: string;
  // ...
}
```

### 3. Service 变更
**文件**: `src/modules/menus/menus.service.ts`, `src/modules/roles/roles.service.ts`

```diff
private readonly menuSelect = {
  id: true,
  routeName: true,
  menuName: true,
  i18nKey: true,
+ iconType: true,
  icon: true,
  localIcon: true,
  // ...
};
```

---

## 📖 使用指南

### 前端使用示例

根据 `iconType` 渲染不同类型的图标：

```typescript
// 菜单项渲染逻辑
function renderMenuIcon(menu: Menu) {
  if (menu.iconType === 1) {
    // 使用 Iconify 图标
    return <Icon icon={menu.icon} />;
  } else if (menu.iconType === 2) {
    // 使用本地图标
    return <LocalIcon name={menu.localIcon} />;
  }
  return null;
}
```

### API 请求示例

```typescript
// 创建使用 Iconify 图标的菜单
POST /api/menus
{
  "routeName": "dashboard",
  "routePath": "/dashboard",
  "menuName": "仪表盘",
  "iconType": 1,
  "icon": "mdi:view-dashboard",
  "menuType": 2
}

// 创建使用本地图标的菜单
POST /api/menus
{
  "routeName": "profile",
  "routePath": "/profile",
  "menuName": "个人中心",
  "iconType": 2,
  "localIcon": "user",
  "menuType": 2
}
```

---

## 🆘 常见问题

### Q1: 为什么需要 iconType 字段？
**A**:
- 明确区分图标来源（Iconify 在线图标库 vs 本地图标资源）
- 前端可以根据类型选择不同的渲染组件
- 避免同时设置两种图标时的歧义

### Q2: iconType 默认值为什么是 1？
**A**:
- Iconify 是更常用的图标方案，提供海量图标
- 保持向后兼容，大多数现有菜单使用 Iconify
- 新创建菜单如果不指定，默认使用 Iconify

### Q3: 可以同时设置 icon 和 localIcon 吗？
**A**:
- 技术上可以，但不推荐
- 应根据 iconType 只设置对应的字段：
  - iconType=1 → 只设置 icon
  - iconType=2 → 只设置 localIcon
- 前端应根据 iconType 决定使用哪个字段

### Q4: query 字段为什么是可选的？
**A**:
- 不是所有菜单都需要查询参数
- 只有需要动态参数的路由才使用（如 `/user?id=123`）
- 大多数菜单路由是静态的，不需要 query

---

## 🎯 最佳实践

### 1. 图标类型选择建议

**使用 Iconify (iconType=1)** 的场景：
- ✅ 需要大量不同的图标
- ✅ 图标库经常更新
- ✅ 希望减少本地资源体积
- ✅ 图标风格统一（Material Design、Ant Design 等）

**使用本地图标 (iconType=2)** 的场景：
- ✅ 自定义品牌图标
- ✅ 需要离线支持
- ✅ 图标需要特殊动画效果
- ✅ 对加载速度要求极高

### 2. 数据一致性建议

```sql
-- 定期检查数据一致性
-- 如果 iconType=1，应该有 icon
SELECT * FROM "menus"
WHERE "icon_type" = 1
  AND ("icon" IS NULL OR "icon" = '');

-- 如果 iconType=2，应该有 localIcon
SELECT * FROM "menus"
WHERE "icon_type" = 2
  AND ("local_icon" IS NULL OR "local_icon" = '');
```

### 3. 创建菜单时的建议

```typescript
// ✅ 推荐：明确指定 iconType
{
  iconType: 1,
  icon: "mdi:home"
}

// ✅ 推荐：明确指定 iconType
{
  iconType: 2,
  localIcon: "custom-icon"
}

// ❌ 不推荐：同时设置两种图标
{
  iconType: 1,
  icon: "mdi:home",
  localIcon: "home"  // 会被忽略
}
```

---

**迁移日期**: 2025-10-27
**影响范围**: Menu 表结构、菜单相关 DTO、Service
**兼容性**: 向后兼容（新字段有默认值）
**数据库版本**: PostgreSQL (Supabase)
