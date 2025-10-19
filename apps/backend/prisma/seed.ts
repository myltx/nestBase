// prisma/seed.ts
// 数据库种子文件 - 用于初始化角色和菜单数据（不会清空用户数据）

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子操作...');

  // ========== 创建角色数据 ==========
  console.log('👥 开始创建/更新角色数据...');

  // 只清空角色菜单关联，不删除角色本身（避免级联删除 user_roles）
  console.log('🧹 清空现有角色菜单关联...');
  await prisma.roleMenu.deleteMany({});

  // 使用 upsert 创建或更新系统内置角色
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
  console.log('  ✅ 创建/更新角色: 管理员 (ADMIN)');

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
  console.log('  ✅ 创建/更新角色: 协调员 (MODERATOR)');

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
  console.log('  ✅ 创建/更新角色: 普通用户 (USER)');

  // 清空现有菜单数据
  console.log('🧹 清空现有菜单数据...');
  await prisma.menu.deleteMany({});

  // ========== 创建菜单数据 ==========
  console.log('📁 开始创建菜单数据...');

  // 1. 创建首页菜单
  const homeMenu = await prisma.menu.create({
    data: {
      routeKey: 'home',
      routePath: '/home',
      title: '首页',
      i18nKey: 'route.home',
      icon: 'mdi:home',
      order: 1,
      menuType: 2, // 菜单
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 首页');

  // 2. 创建用户管理菜单(父菜单)
  const userManagementMenu = await prisma.menu.create({
    data: {
      routeKey: 'user-management',
      routePath: '/user-management',
      title: '用户管理',
      i18nKey: 'route.user-management',
      icon: 'mdi:account-group',
      order: 2,
      menuType: 1, // 目录
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 用户管理');

  // 2.1 用户列表
  const userListMenu = await prisma.menu.create({
    data: {
      routeKey: 'user-list',
      routePath: '/user-management/list',
      title: '用户列表',
      i18nKey: 'route.user-list',
      icon: 'mdi:account-multiple',
      order: 1,
      parentId: userManagementMenu.id,
      menuType: 2, // 菜单
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 用户列表');

  // 2.2 角色管理
  const roleManagementMenu = await prisma.menu.create({
    data: {
      routeKey: 'role-management',
      routePath: '/user-management/roles',
      title: '角色管理',
      i18nKey: 'route.role-management',
      icon: 'mdi:shield-account',
      order: 2,
      parentId: userManagementMenu.id,
      menuType: 2, // 菜单
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 角色管理');

  // 3. 创建系统管理菜单(父菜单)
  const systemMenu = await prisma.menu.create({
    data: {
      routeKey: 'system',
      routePath: '/system',
      title: '系统管理',
      i18nKey: 'route.system',
      icon: 'mdi:cog',
      order: 3,
      menuType: 1, // 目录
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 系统管理');

  // 3.1 菜单管理
  const menuManagementMenu = await prisma.menu.create({
    data: {
      routeKey: 'menu-management',
      routePath: '/system/menus',
      title: '菜单管理',
      i18nKey: 'route.menu-management',
      icon: 'mdi:menu',
      order: 1,
      parentId: systemMenu.id,
      menuType: 2, // 菜单
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 菜单管理');

  // 3.2 系统设置
  const systemSettingsMenu = await prisma.menu.create({
    data: {
      routeKey: 'system-settings',
      routePath: '/system/settings',
      title: '系统设置',
      i18nKey: 'route.system-settings',
      icon: 'mdi:cog-outline',
      order: 2,
      parentId: systemMenu.id,
      menuType: 2, // 菜单
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 系统设置');

  // 4. 创建项目管理菜单
  const projectMenu = await prisma.menu.create({
    data: {
      routeKey: 'projects',
      routePath: '/projects',
      title: '项目管理',
      i18nKey: 'route.projects',
      icon: 'mdi:folder-multiple',
      order: 4,
      menuType: 2, // 菜单
      constant: false,
    },
  });
  console.log('  ✅ 创建菜单: 项目管理');

  // ========== 为角色分配菜单 ==========
  console.log('🔗 开始为角色分配菜单...');

  // ADMIN 角色拥有所有菜单
  await prisma.roleMenu.createMany({
    data: [
      { roleId: adminRole.id, menuId: homeMenu.id },
      { roleId: adminRole.id, menuId: userManagementMenu.id },
      { roleId: adminRole.id, menuId: userListMenu.id },
      { roleId: adminRole.id, menuId: roleManagementMenu.id },
      { roleId: adminRole.id, menuId: systemMenu.id },
      { roleId: adminRole.id, menuId: menuManagementMenu.id },
      { roleId: adminRole.id, menuId: systemSettingsMenu.id },
      { roleId: adminRole.id, menuId: projectMenu.id },
    ],
  });
  console.log('  ✅ ADMIN 角色菜单分配完成(8个菜单)');

  // MODERATOR 角色拥有部分菜单
  await prisma.roleMenu.createMany({
    data: [
      { roleId: moderatorRole.id, menuId: homeMenu.id },
      { roleId: moderatorRole.id, menuId: userManagementMenu.id },
      { roleId: moderatorRole.id, menuId: userListMenu.id },
      { roleId: moderatorRole.id, menuId: projectMenu.id },
    ],
  });
  console.log('  ✅ MODERATOR 角色菜单分配完成(4个菜单)');

  // USER 角色拥有基础菜单
  await prisma.roleMenu.createMany({
    data: [
      { roleId: userRole.id, menuId: homeMenu.id },
      { roleId: userRole.id, menuId: projectMenu.id },
    ],
  });
  console.log('  ✅ USER 角色菜单分配完成(2个菜单)');

  console.log('🎉 数据库种子操作完成!');
  console.log('');
  console.log('📋 已初始化:');
  console.log('  ✅ 3个系统角色 (ADMIN, MODERATOR, USER)');
  console.log('  ✅ 8个系统菜单');
  console.log('  ✅ 角色菜单权限配置');
  console.log('');
  console.log('💡 提示: 用户数据和用户角色关联已保留，不会被清空');
}

main()
  .catch((e) => {
    console.error('❌ 种子操作失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
