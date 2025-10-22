// prisma/migrate-to-unified-permissions.ts
/**
 * 数据迁移脚本：将旧的 Menu 和 Permission 数据迁移到新的统一 Permission 表
 *
 * 执行步骤：
 * 1. 备份旧数据到 menus_old 和 role_menus_old 表
 * 2. 将菜单数据迁移到新的 permissions 表（type=MENU）
 * 3. 保持角色关联关系
 * 4. 验证迁移结果
 */

import { PrismaClient, PermissionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('========================================');
  console.log('🔄 开始数据迁移：统一权限模型');
  console.log('========================================');
  console.log('');

  // 步骤 1：备份旧的 Menu 数据
  console.log('📦 步骤 1: 备份旧菜单数据到 menus_old 表...');

  try {
    // 检查旧的 menus 表是否存在数据
    const oldMenusCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM menus
    `;
    console.log(`  ℹ️  发现 ${(oldMenusCount as any)[0].count} 条菜单数据`);

    if ((oldMenusCount as any)[0].count > 0) {
      // 将数据复制到 menus_old 表
      await prisma.$executeRaw`
        INSERT INTO menus_old (
          id, route_name, route_path, menu_name, title, i18n_key, icon,
          local_icon, icon_font_size, "order", parent_id, menu_type,
          component, href, hide_in_menu, active_menu, multi_tab,
          fixed_index_in_tab, status, keep_alive, constant, query,
          created_at, updated_at
        )
        SELECT
          id, route_name, route_path, menu_name, title, i18n_key, icon,
          local_icon, icon_font_size, "order", parent_id, menu_type,
          component, href, hide_in_menu, active_menu, multi_tab,
          fixed_index_in_tab, status, keep_alive, constant, query,
          created_at, updated_at
        FROM menus
        ON CONFLICT (id) DO NOTHING
      `;
      console.log('  ✅ 菜单数据已备份到 menus_old 表');

      // 备份角色菜单关联
      await prisma.$executeRaw`
        INSERT INTO role_menus_old (id, role_id, menu_id, created_at)
        SELECT id, role_id, menu_id, created_at
        FROM role_menus
        ON CONFLICT (role_id, menu_id) DO NOTHING
      `;
      console.log('  ✅ 角色菜单关联已备份到 role_menus_old 表');
    } else {
      console.log('  ℹ️  未发现菜单数据，跳过备份');
    }
  } catch (error: any) {
    if (error.code === 'P2010' || error.message.includes('does not exist')) {
      console.log('  ℹ️  旧菜单表不存在，跳过备份步骤');
    } else {
      throw error;
    }
  }

  console.log('');

  // 步骤 2：迁移菜单数据到新的 permissions 表
  console.log('🔄 步骤 2: 迁移菜单数据到新的 permissions 表...');

  try {
    const menus = await prisma.$queryRaw`
      SELECT * FROM menus ORDER BY "order" ASC
    ` as any[];

    if (menus.length > 0) {
      let migratedCount = 0;

      for (const menu of menus) {
        // 将菜单数据迁移到 permissions 表
        await prisma.permission.create({
          data: {
            id: menu.id,
            code: menu.route_name,
            name: menu.menu_name || menu.title,
            description: `菜单: ${menu.title}`,
            type: PermissionType.MENU,
            parentId: menu.parent_id,
            routePath: menu.route_path,
            component: menu.component,
            icon: menu.icon,
            i18nKey: menu.i18n_key,
            sort: menu.order || 0,
            visible: !menu.hide_in_menu,
            status: menu.status || 1,
            isSystem: menu.constant || false,
            createdAt: menu.created_at,
            updatedAt: menu.updated_at,
          },
        });
        migratedCount++;
      }

      console.log(`  ✅ 已迁移 ${migratedCount} 条菜单数据`);
    } else {
      console.log('  ℹ️  未发现菜单数据，跳过迁移');
    }
  } catch (error: any) {
    if (error.code === 'P2010' || error.message.includes('does not exist')) {
      console.log('  ℹ️  旧菜单表不存在，跳过迁移');
    } else if (error.code === 'P2002') {
      console.log('  ⚠️  数据已存在，跳过迁移');
    } else {
      console.error('  ❌ 迁移失败:', error.message);
      throw error;
    }
  }

  console.log('');

  // 步骤 3：迁移角色菜单关联到角色权限关联
  console.log('🔗 步骤 3: 迁移角色菜单关联到角色权限关联...');

  try {
    const roleMenus = await prisma.$queryRaw`
      SELECT * FROM role_menus
    ` as any[];

    if (roleMenus.length > 0) {
      let migratedCount = 0;

      for (const roleMenu of roleMenus) {
        await prisma.rolePermission.create({
          data: {
            id: roleMenu.id,
            roleId: roleMenu.role_id,
            permissionId: roleMenu.menu_id,
            createdAt: roleMenu.created_at,
          },
        });
        migratedCount++;
      }

      console.log(`  ✅ 已迁移 ${migratedCount} 条角色菜单关联`);
    } else {
      console.log('  ℹ️  未发现角色菜单关联，跳过迁移');
    }
  } catch (error: any) {
    if (error.code === 'P2010' || error.message.includes('does not exist')) {
      console.log('  ℹ️  旧角色菜单关联表不存在，跳过迁移');
    } else if (error.code === 'P2002') {
      console.log('  ⚠️  关联数据已存在，跳过迁移');
    } else {
      console.error('  ❌ 迁移失败:', error.message);
      throw error;
    }
  }

  console.log('');

  // 步骤 4：验证迁移结果
  console.log('✅ 步骤 4: 验证迁移结果...');

  const newPermissionsCount = await prisma.permission.count({
    where: { type: PermissionType.MENU },
  });

  const newRolePermissionsCount = await prisma.rolePermission.count();

  console.log(`  ✅ 新 permissions 表中的菜单数量: ${newPermissionsCount}`);
  console.log(`  ✅ 新 role_permissions 表中的关联数量: ${newRolePermissionsCount}`);

  console.log('');

  // 步骤 5：删除旧表（可选，建议手动执行）
  console.log('⚠️  步骤 5: 删除旧表');
  console.log('  ⚠️  旧数据已备份到 menus_old 和 role_menus_old 表');
  console.log('  ⚠️  请确认数据迁移成功后，手动执行以下 SQL 删除旧表:');
  console.log('');
  console.log('  DROP TABLE role_menus;');
  console.log('  DROP TABLE menus;');
  console.log('');
  console.log('  ℹ️  如需恢复旧表，请执行:');
  console.log('  ALTER TABLE menus_old RENAME TO menus;');
  console.log('  ALTER TABLE role_menus_old RENAME TO role_menus;');
  console.log('');

  console.log('========================================');
  console.log('🎉 数据迁移完成！');
  console.log('========================================');
  console.log('');
  console.log('📋 迁移摘要:');
  console.log(`  ✅ 菜单数据: ${newPermissionsCount} 条`);
  console.log(`  ✅ 角色关联: ${newRolePermissionsCount} 条`);
  console.log('');
  console.log('💡 下一步:');
  console.log('  1. 运行种子脚本添加按钮和 API 权限: pnpm prisma:seed');
  console.log('  2. 测试权限系统功能');
  console.log('  3. 确认无误后，删除旧表（menus, role_menus）');
  console.log('');
}

main()
  .catch((e) => {
    console.error('');
    console.error('========================================');
    console.error('❌ 迁移失败!');
    console.error('========================================');
    console.error('');
    console.error('错误详情:', e);
    console.error('');
    console.error('💡 故障排查:');
    console.error('  1. 检查数据库连接是否正常');
    console.error('  2. 确认 Prisma Schema 已同步: npx prisma db push');
    console.error('  3. 查看错误日志获取详细信息');
    console.error('');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
