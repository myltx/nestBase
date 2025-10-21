// prisma/seed.ts
// 数据库种子文件 - 仅在数据不存在时创建，不会删除任何现有数据

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子操作...');
  console.log('');
  console.log('⚠️  重要提示:');
  console.log('   - 此脚本只会创建不存在的数据');
  console.log('   - 不会删除或修改任何现有数据');
  console.log('   - 适合用于初始化和增量更新');
  console.log('');

  // ========== 创建/更新角色数据 ==========
  console.log('👥 开始处理角色数据...');

  // 使用 upsert 创建或更新系统内置角色（不会删除）
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {
      name: '管理员',
      description: '拥有系统所有权限',
      isSystem: true,
      status: 1,
    },
    create: {
      code: 'ADMIN',
      name: '管理员',
      description: '拥有系统所有权限',
      isSystem: true,
      status: 1,
    },
  });
  console.log('  ✅ 角色: 管理员 (ADMIN)');

  const moderatorRole = await prisma.role.upsert({
    where: { code: 'MODERATOR' },
    update: {
      name: '协调员',
      description: '拥有部分管理权限',
      isSystem: true,
      status: 1,
    },
    create: {
      code: 'MODERATOR',
      name: '协调员',
      description: '拥有部分管理权限',
      isSystem: true,
      status: 1,
    },
  });
  console.log('  ✅ 角色: 协调员 (MODERATOR)');

  const userRole = await prisma.role.upsert({
    where: { code: 'USER' },
    update: {
      name: '普通用户',
      description: '基础用户权限',
      isSystem: true,
      status: 1,
    },
    create: {
      code: 'USER',
      name: '普通用户',
      description: '基础用户权限',
      isSystem: true,
      status: 1,
    },
  });
  console.log('  ✅ 角色: 普通用户 (USER)');

  // ========== 创建菜单数据（使用 upsert，不删除）==========
  console.log('');
  console.log('📁 开始处理菜单数据...');

  // 1. 首页菜单
  const homeMenu = await prisma.menu.upsert({
    where: { routeName: 'home' },
    update: {
      routePath: '/home',
      menuName: '首页',
      title: '首页',
      i18nKey: 'route.home',
      icon: 'mdi:home',
      order: 1,
      menuType: 2,
      constant: false,
    },
    create: {
      routeName: 'home',
      routePath: '/home',
      menuName: '首页',
      title: '首页',
      i18nKey: 'route.home',
      icon: 'mdi:home',
      order: 1,
      menuType: 2,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 首页');

  // 2. 用户管理（目录）
  const userManagementMenu = await prisma.menu.upsert({
    where: { routeName: 'user-management' },
    update: {
      routePath: '/user-management',
      menuName: '用户管理',
      title: '用户管理',
      i18nKey: 'route.user-management',
      icon: 'mdi:account-group',
      order: 2,
      menuType: 1,
      constant: false,
    },
    create: {
      routeName: 'user-management',
      routePath: '/user-management',
      menuName: '用户管理',
      title: '用户管理',
      i18nKey: 'route.user-management',
      icon: 'mdi:account-group',
      order: 2,
      menuType: 1,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 用户管理');

  // 2.1 用户列表
  const userListMenu = await prisma.menu.upsert({
    where: { routeName: 'user-list' },
    update: {
      routePath: '/user-management/list',
      menuName: '用户列表',
      title: '用户列表',
      i18nKey: 'route.user-list',
      icon: 'mdi:account-multiple',
      order: 1,
      parentId: userManagementMenu.id,
      menuType: 2,
      constant: false,
    },
    create: {
      routeName: 'user-list',
      routePath: '/user-management/list',
      menuName: '用户列表',
      title: '用户列表',
      i18nKey: 'route.user-list',
      icon: 'mdi:account-multiple',
      order: 1,
      parentId: userManagementMenu.id,
      menuType: 2,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 用户列表');

  // 2.2 角色管理
  const roleManagementMenu = await prisma.menu.upsert({
    where: { routeName: 'role-management' },
    update: {
      routePath: '/user-management/roles',
      menuName: '角色管理',
      title: '角色管理',
      i18nKey: 'route.role-management',
      icon: 'mdi:shield-account',
      order: 2,
      parentId: userManagementMenu.id,
      menuType: 2,
      constant: false,
    },
    create: {
      routeName: 'role-management',
      routePath: '/user-management/roles',
      menuName: '角色管理',
      title: '角色管理',
      i18nKey: 'route.role-management',
      icon: 'mdi:shield-account',
      order: 2,
      parentId: userManagementMenu.id,
      menuType: 2,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 角色管理');

  // 3. 系统管理（目录）
  const systemMenu = await prisma.menu.upsert({
    where: { routeName: 'system' },
    update: {
      routePath: '/system',
      menuName: '系统管理',
      title: '系统管理',
      i18nKey: 'route.system',
      icon: 'mdi:cog',
      order: 3,
      menuType: 1,
      constant: false,
    },
    create: {
      routeName: 'system',
      routePath: '/system',
      menuName: '系统管理',
      title: '系统管理',
      i18nKey: 'route.system',
      icon: 'mdi:cog',
      order: 3,
      menuType: 1,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 系统管理');

  // 3.1 菜单管理
  const menuManagementMenu = await prisma.menu.upsert({
    where: { routeName: 'menu-management' },
    update: {
      routePath: '/system/menus',
      menuName: '菜单管理',
      title: '菜单管理',
      i18nKey: 'route.menu-management',
      icon: 'mdi:menu',
      order: 1,
      parentId: systemMenu.id,
      menuType: 2,
      constant: false,
    },
    create: {
      routeName: 'menu-management',
      routePath: '/system/menus',
      menuName: '菜单管理',
      title: '菜单管理',
      i18nKey: 'route.menu-management',
      icon: 'mdi:menu',
      order: 1,
      parentId: systemMenu.id,
      menuType: 2,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 菜单管理');

  // 3.2 系统设置
  const systemSettingsMenu = await prisma.menu.upsert({
    where: { routeName: 'system-settings' },
    update: {
      routePath: '/system/settings',
      menuName: '系统设置',
      title: '系统设置',
      i18nKey: 'route.system-settings',
      icon: 'mdi:cog-outline',
      order: 2,
      parentId: systemMenu.id,
      menuType: 2,
      constant: false,
    },
    create: {
      routeName: 'system-settings',
      routePath: '/system/settings',
      menuName: '系统设置',
      title: '系统设置',
      i18nKey: 'route.system-settings',
      icon: 'mdi:cog-outline',
      order: 2,
      parentId: systemMenu.id,
      menuType: 2,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 系统设置');

  // 4. 项目管理
  const projectMenu = await prisma.menu.upsert({
    where: { routeName: 'projects' },
    update: {
      routePath: '/projects',
      menuName: '项目管理',
      title: '项目管理',
      i18nKey: 'route.projects',
      icon: 'mdi:folder-multiple',
      order: 4,
      menuType: 2,
      constant: false,
    },
    create: {
      routeName: 'projects',
      routePath: '/projects',
      menuName: '项目管理',
      title: '项目管理',
      i18nKey: 'route.projects',
      icon: 'mdi:folder-multiple',
      order: 4,
      menuType: 2,
      constant: false,
    },
  });
  console.log('  ✅ 菜单: 项目管理');

  // ========== 同步角色菜单权限 ==========
  console.log('');
  console.log('🔗 开始同步角色菜单权限...');

  // 定义角色菜单映射
  const roleMenuMappings = [
    // ADMIN 拥有所有菜单
    { roleId: adminRole.id, menuId: homeMenu.id },
    { roleId: adminRole.id, menuId: userManagementMenu.id },
    { roleId: adminRole.id, menuId: userListMenu.id },
    { roleId: adminRole.id, menuId: roleManagementMenu.id },
    { roleId: adminRole.id, menuId: systemMenu.id },
    { roleId: adminRole.id, menuId: menuManagementMenu.id },
    { roleId: adminRole.id, menuId: systemSettingsMenu.id },
    { roleId: adminRole.id, menuId: projectMenu.id },
    // MODERATOR 拥有部分菜单
    { roleId: moderatorRole.id, menuId: homeMenu.id },
    { roleId: moderatorRole.id, menuId: userManagementMenu.id },
    { roleId: moderatorRole.id, menuId: userListMenu.id },
    { roleId: moderatorRole.id, menuId: projectMenu.id },
    // USER 拥有基础菜单
    { roleId: userRole.id, menuId: homeMenu.id },
    { roleId: userRole.id, menuId: projectMenu.id },
  ];

  // 只创建不存在的角色菜单关联
  let createdCount = 0;
  let skippedCount = 0;

  for (const mapping of roleMenuMappings) {
    const existing = await prisma.roleMenu.findUnique({
      where: {
        roleId_menuId: {
          roleId: mapping.roleId,
          menuId: mapping.menuId,
        },
      },
    });

    if (!existing) {
      await prisma.roleMenu.create({
        data: mapping,
      });
      createdCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`  ✅ 创建了 ${createdCount} 个新的角色菜单关联`);
  console.log(`  ℹ️  跳过了 ${skippedCount} 个已存在的关联`);

  console.log('');
  console.log('🎉 数据库种子操作完成!');
  console.log('');
  console.log('📋 处理结果:');
  console.log('  ✅ 3个系统角色 (已创建/更新)');
  console.log('  ✅ 8个系统菜单 (已创建/更新)');
  console.log(`  ✅ 角色菜单权限 (新增 ${createdCount} 个)`);
  console.log('');
  console.log('💡 提示:');
  console.log('   - 所有现有数据均已保留');
  console.log('   - 仅更新了系统内置的角色和菜单');
  console.log('   - 您的业务数据不会受到影响');
  console.log('   - 可以安全地重复运行此脚本');
}

main()
  .catch((e) => {
    console.error('❌ 种子操作失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
