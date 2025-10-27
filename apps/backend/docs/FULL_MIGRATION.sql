# 完整数据库迁移 SQL 脚本

## 执行前准备

本脚本用于手动迁移数据库，包含以下变更：
1. Menu 表：删除 `title` 字段，添加 `icon_type` 字段
2. Permission 表：删除 `resource`、`action`、`is_system` 字段，添加 `type`、`menu_id` 字段

**重要**: 请在执行前备份数据库！

```bash
pg_dump -h your-host -U your-user -d your-db > backup_full_migration.sql
```

---

## Step 1: 备份将要删除的数据

```sql
-- 创建临时表保存 menus.title 数据
CREATE TEMP TABLE temp_menu_titles AS
SELECT id, title, menu_name
FROM menus;

-- 创建临时表保存 permissions 的旧字段数据
CREATE TEMP TABLE temp_permission_old_fields AS
SELECT id, code, name, resource, action, is_system
FROM permissions;
```

---

## Step 2: Menu 表迁移

```sql
-- 2.1 如果 menu_name 为空，从 title 复制数据
UPDATE menus
SET menu_name = title
WHERE (menu_name = '' OR menu_name IS NULL) AND title IS NOT NULL;

-- 2.2 删除 title 字段
ALTER TABLE menus
DROP COLUMN IF EXISTS title;

-- 2.3 添加 icon_type 字段
ALTER TABLE menus
ADD COLUMN IF NOT EXISTS icon_type INTEGER DEFAULT 1;

-- 2.4 智能设置 icon_type（根据现有图标数据）
-- 如果有 localIcon 但没有 icon，设置为本地图标
UPDATE menus
SET icon_type = 2
WHERE local_icon IS NOT NULL
  AND local_icon != ''
  AND (icon IS NULL OR icon = '');

-- 如果有 icon，设置为 Iconify 图标
UPDATE menus
SET icon_type = 1
WHERE icon IS NOT NULL AND icon != '';
```

---

## Step 3: Permission 表迁移

```sql
-- 3.1 创建 PermissionType 枚举（如果不存在）
DO $$ BEGIN
  CREATE TYPE "PermissionType" AS ENUM ('MENU', 'BUTTON', 'API');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3.2 添加新字段
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS type "PermissionType" DEFAULT 'BUTTON';

ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS menu_id UUID;

-- 3.3 根据旧的 resource.action 模式智能设置 type
-- 菜单权限（view, access）
UPDATE permissions
SET type = 'MENU'
WHERE action IN ('view', 'access', 'read');

-- API 权限（如果 code 包含 :api: 模式）
UPDATE permissions
SET type = 'API'
WHERE code LIKE '%:api:%';

-- 其余的设为按钮权限（create, update, delete, export, import 等）
UPDATE permissions
SET type = 'BUTTON'
WHERE type IS NULL;

-- 3.4 添加外键约束
ALTER TABLE permissions
ADD CONSTRAINT IF NOT EXISTS permissions_menu_id_fkey
  FOREIGN KEY (menu_id)
  REFERENCES menus(id)
  ON DELETE CASCADE;

-- 3.5 删除旧字段
ALTER TABLE permissions
DROP COLUMN IF EXISTS resource,
DROP COLUMN IF EXISTS action,
DROP COLUMN IF EXISTS is_system;

-- 3.6 删除旧的 name unique 约束（如果存在）
ALTER TABLE permissions
DROP CONSTRAINT IF EXISTS permissions_name_key;

-- 3.7 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS permissions_type_idx ON permissions(type);
CREATE INDEX IF NOT EXISTS permissions_menu_id_idx ON permissions(menu_id);
```

---

## Step 4: 验证迁移结果

```sql
-- 4.1 检查 menus 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'menus'
  AND column_name IN ('menu_name', 'title', 'icon_type')
ORDER BY ordinal_position;

-- 预期结果：
-- - menu_name 存在
-- - title 不存在
-- - icon_type 存在，默认值为 1

-- 4.2 检查是否有空的 menu_name
SELECT COUNT(*) as empty_menu_names
FROM menus
WHERE menu_name = '' OR menu_name IS NULL;
-- 应该为 0

-- 4.3 检查 icon_type 分布
SELECT
  icon_type,
  COUNT(*) as count,
  CASE
    WHEN icon_type = 1 THEN 'Iconify'
    WHEN icon_type = 2 THEN 'Local'
    ELSE 'Unknown'
  END as type_name
FROM menus
GROUP BY icon_type;

-- 4.4 检查 permissions 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'permissions'
  AND column_name IN ('type', 'menu_id', 'resource', 'action', 'is_system')
ORDER BY ordinal_position;

-- 预期结果：
-- - type 存在（PermissionType 枚举）
-- - menu_id 存在（UUID）
-- - resource, action, is_system 都不存在

-- 4.5 检查权限类型分布
SELECT
  type,
  COUNT(*) as count
FROM permissions
GROUP BY type;

-- 4.6 查看迁移后的权限数据示例
SELECT id, name, code, type, menu_id
FROM permissions
LIMIT 10;
```

---

## Step 5: 清理临时表

```sql
DROP TABLE IF EXISTS temp_menu_titles;
DROP TABLE IF EXISTS temp_permission_old_fields;
```

---

## 回滚脚本（如果需要）

```sql
-- 回滚 Menu 表
ALTER TABLE menus
ADD COLUMN title TEXT;

UPDATE menus
SET title = menu_name;

ALTER TABLE menus
ALTER COLUMN title SET NOT NULL;

ALTER TABLE menus
DROP COLUMN icon_type;

-- 回滚 Permission 表
ALTER TABLE permissions
ADD COLUMN resource TEXT DEFAULT 'unknown',
ADD COLUMN action TEXT DEFAULT 'manage',
ADD COLUMN is_system BOOLEAN DEFAULT false;

ALTER TABLE permissions
DROP COLUMN type,
DROP COLUMN menu_id;

DROP TYPE IF EXISTS "PermissionType";

ALTER TABLE permissions
ADD CONSTRAINT permissions_name_key UNIQUE (name);
```

---

## 使用说明

### 方式一：使用此 SQL 脚本（推荐用于生产环境）

```bash
# 1. 连接到数据库
psql -h your-host -U your-user -d your-db

# 2. 执行迁移脚本
\i migration_full.sql

# 3. 检查结果
```

### 方式二：使用 Prisma db push（开发环境快速方式）

```bash
cd apps/backend

# 方式 2a: 接受数据丢失（会自动保留 menu_name）
npx prisma db push --accept-data-loss

# 方式 2b: 完全重置（会清空所有数据）
npx prisma db push --force-reset
pnpm seed  # 重新填充测试数据
```

---

## 数据映射策略说明

### Menu 表数据映射

| 旧字段 | 新字段 | 映射逻辑 |
|--------|--------|----------|
| `title` | `menuName` | 如果 `menuName` 为空，从 `title` 复制 |
| - | `iconType` | 根据现有 `icon`/`localIcon` 智能设置 |

### Permission 表数据映射

| 旧字段 | 新字段 | 映射逻辑 |
|--------|--------|----------|
| `action` = 'view', 'access', 'read' | `type` = 'MENU' | 查看类权限映射为菜单权限 |
| `code` 包含 ':api:' | `type` = 'API' | API 权限 |
| 其他 `action` | `type` = 'BUTTON' | 默认为按钮权限 |
| `resource` + `action` | - | 删除（信息已包含在 `code` 中） |
| `is_system` | - | 删除（通过 `code` 前缀区分系统权限） |

---

**创建日期**: 2025-10-27
**适用环境**: PostgreSQL (Supabase)
**Prisma 版本**: 5.22.0
