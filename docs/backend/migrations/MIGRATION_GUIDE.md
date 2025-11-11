# 权限系统重构 - 数据库迁移指南

## 📋 迁移概述

本次重构简化了权限系统，主要变更包括：

### 数据库结构变更

#### 1. Permission 表修改
**移除字段**:
- `resource` VARCHAR - 资源名称
- `action` VARCHAR - 操作类型
- `is_system` BOOLEAN - 是否系统内置权限
- `name` 的 UNIQUE 约束（name 不再要求唯一）

**新增字段**:
- `type` ENUM('MENU', 'BUTTON', 'API') - 权限类型
- `menu_id` UUID NULL - 关联菜单ID（type为BUTTON/API时）

#### 2. Menu 表修改
**新增关系**:
- `permissions` - 一对多关系（通过 Permission.menuId）

#### 3. 删除表
- **menu_permissions** - 菜单权限关联表（已废弃）

---

## 🚀 执行迁移步骤

### 方式一：使用 Prisma Migrate（推荐）

```bash
# 1. 确保在 apps/backend 目录
cd apps/backend

# 2. 创建迁移文件
npx prisma migrate dev --name refactor_permission_system

# 这会：
# - 生成迁移 SQL 文件
# - 自动应用到数据库
# - 重新生成 Prisma Client
```

### 方式二：手动 SQL 迁移

如果您希望手动执行，可以运行以下 SQL：

```sql
-- 1. 创建权限类型枚举
CREATE TYPE "PermissionType" AS ENUM ('MENU', 'BUTTON', 'API');

-- 2. 修改 permissions 表
ALTER TABLE "permissions"
  -- 新增字段
  ADD COLUMN "type" "PermissionType" NOT NULL DEFAULT 'BUTTON',
  ADD COLUMN "menu_id" UUID,
  -- 移除字段
  DROP COLUMN "resource",
  DROP COLUMN "action",
  DROP COLUMN "is_system",
  -- 移除 name 唯一约束
  DROP CONSTRAINT IF EXISTS "permissions_name_key";

-- 3. 添加外键约束
ALTER TABLE "permissions"
  ADD CONSTRAINT "permissions_menu_id_fkey"
  FOREIGN KEY ("menu_id")
  REFERENCES "menus"("id")
  ON DELETE CASCADE;

-- 4. 删除 menu_permissions 表
DROP TABLE IF EXISTS "menu_permissions" CASCADE;

-- 5. 创建索引（可选，提升查询性能）
CREATE INDEX "permissions_type_idx" ON "permissions"("type");
CREATE INDEX "permissions_menu_id_idx" ON "permissions"("menu_id");
```

---

## ⚠️ 迁移前注意事项

### 1. 备份数据

```bash
# 备份当前数据库
pg_dump -h your-host -U your-user -d your-db > backup_before_migration.sql
```

### 2. 数据迁移策略

由于字段结构变更，现有权限数据需要映射：

```sql
-- 示例：将旧的 resource.action 映射到新的 type 和 code
-- 这需要根据您的实际数据调整

-- 对于菜单权限（通常 action = 'view' 或 'access'）
UPDATE "permissions"
SET "type" = 'MENU'
WHERE "action" IN ('view', 'access', 'read');

-- 对于按钮权限（create, update, delete等）
UPDATE "permissions"
SET "type" = 'BUTTON'
WHERE "action" IN ('create', 'update', 'delete', 'export', 'import');

-- 对于API权限
UPDATE "permissions"
SET "type" = 'API'
WHERE "code" LIKE '%:api:%';
```

### 3. 清理 menu_permissions 数据

```sql
-- 由于新系统不再使用 menu_permissions 表
-- 权限直接通过 menuId 字段关联菜单
-- 如果需要保留关联关系，需要手动迁移：

UPDATE "permissions" p
SET "menu_id" = mp."menu_id"
FROM "menu_permissions" mp
WHERE p."id" = mp."permission_id";
```

---

## ✅ 迁移后验证

### 1. 检查表结构

```sql
-- 查看 permissions 表结构
\d permissions

-- 确认字段：
-- - type (PermissionType)
-- - menu_id (UUID, nullable)
-- - 无 resource, action, is_system 字段
```

### 2. 验证数据

```sql
-- 查看权限类型分布
SELECT type, COUNT(*)
FROM permissions
GROUP BY type;

-- 查看关联菜单的权限
SELECT p.*, m.menu_name
FROM permissions p
LEFT JOIN menus m ON p.menu_id = m.id
WHERE p.menu_id IS NOT NULL;
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

如果需要回滚到旧版本：

### 1. 使用 Prisma Migrate 回滚

```bash
# 查看迁移历史
npx prisma migrate status

# 回滚到上一个版本
npx prisma migrate reset
```

### 2. 手动回滚 SQL

```sql
-- 1. 重新创建 menu_permissions 表
CREATE TABLE "menu_permissions" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "menu_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "menu_permissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "menu_permissions_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
);

-- 2. 恢复 permissions 表字段
ALTER TABLE "permissions"
  ADD COLUMN "resource" TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN "action" TEXT NOT NULL DEFAULT 'manage',
  ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false,
  DROP COLUMN "type",
  DROP COLUMN "menu_id",
  ADD CONSTRAINT "permissions_name_key" UNIQUE ("name");

-- 3. 删除枚举类型
DROP TYPE IF EXISTS "PermissionType";
```

---

## 📊 新旧对比

### 旧系统
```
Permission {
  code: "user.create"
  name: "创建用户"
  resource: "user"
  action: "create"
  isSystem: false
}

MenuPermission {
  menuId: "menu-uuid"
  permissionId: "perm-uuid"
}
```

### 新系统
```
Permission {
  code: "user:create"
  name: "创建用户"
  type: "BUTTON"
  menuId: "menu-uuid"  // 直接关联
}
```

---

## 🆘 常见问题

### Q1: 迁移失败怎么办？
**A**:
1. 检查数据库连接
2. 确认没有其他进程占用数据库
3. 查看 Prisma 错误日志
4. 如有必要，使用备份恢复数据

### Q2: 现有权限数据如何处理？
**A**:
需要手动映射。建议：
1. 导出现有权限数据
2. 编写迁移脚本转换数据
3. 清空旧数据
4. 导入新格式数据

### Q3: 如何确保数据一致性？
**A**:
1. 迁移前备份
2. 在测试环境先执行
3. 验证数据完整性
4. 测试应用功能
5. 确认无误后再在生产环境执行

---

**创建日期**: 2025-10-27
**Prisma 版本**: 5.22.0
**数据库**: PostgreSQL (Supabase)
