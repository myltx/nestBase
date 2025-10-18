// prisma/seed.ts
// 数据库种子文件 - 用于初始化测试数据

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子操作...');

  // ========== 创建角色数据 ==========
  console.log('👥 开始创建角色数据...');

  // 清空现有角色数据
  console.log('🧹 清空现有角色关联数据...');
  await prisma.userRole.deleteMany({});
  await prisma.roleMenu.deleteMany({});
  await prisma.role.deleteMany({});

  // 创建系统内置角色
  const adminRole = await prisma.role.create({
    data: {
      code: 'ADMIN',
      name: '管理员',
      description: '拥有系统所有权限',
      isSystem: true,
      isActive: true,
    },
  });
  console.log('  ✅ 创建角色: 管理员 (ADMIN)');

  const moderatorRole = await prisma.role.create({
    data: {
      code: 'MODERATOR',
      name: '协调员',
      description: '拥有部分管理权限',
      isSystem: true,
      isActive: true,
    },
  });
  console.log('  ✅ 创建角色: 协调员 (MODERATOR)');

  const userRole = await prisma.role.create({
    data: {
      code: 'USER',
      name: '普通用户',
      description: '基础用户权限',
      isSystem: true,
      isActive: true,
    },
  });
  console.log('  ✅ 创建角色: 普通用户 (USER)');

  // ========== 创建或更新用户数据 ==========
  console.log('👤 开始创建/更新用户数据...');

  // 创建管理员用户 Admin / ll666888
  const adminHashedPassword = await bcrypt.hash('ll666888', 10);

  // 检查管理员是否存在
  let admin = await prisma.user.findUnique({
    where: { userName: 'Admin' },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        userName: 'Admin',
        password: adminHashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        isActive: true,
      },
    });
    console.log('  ✅ 创建管理员用户: Admin');
  } else {
    // 更新密码
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: adminHashedPassword },
    });
    console.log('  ✅ 更新管理员用户密码: Admin');
  }

  // 为 Admin 分配 ADMIN 和 MODERATOR 角色
  await prisma.userRole.deleteMany({
    where: { userId: admin.id },
  });
  await prisma.userRole.createMany({
    data: [
      { userId: admin.id, roleId: adminRole.id },
      { userId: admin.id, roleId: moderatorRole.id },
    ],
  });
  console.log('  ✅ 为 Admin 分配角色: ADMIN, MODERATOR');

  // 创建普通用户 test / 123456A
  const testHashedPassword = await bcrypt.hash('123456A', 10);

  let testUser = await prisma.user.findUnique({
    where: { userName: 'test' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        userName: 'test',
        password: testHashedPassword,
        firstName: 'Test',
        lastName: 'User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        isActive: true,
      },
    });
    console.log('  ✅ 创建普通用户: test');
  } else {
    // 更新密码
    await prisma.user.update({
      where: { id: testUser.id },
      data: { password: testHashedPassword },
    });
    console.log('  ✅ 更新普通用户密码: test');
  }

  // 为 test 分配 USER 角色
  await prisma.userRole.deleteMany({
    where: { userId: testUser.id },
  });
  await prisma.userRole.create({
    data: {
      userId: testUser.id,
      roleId: userRole.id,
    },
  });
  console.log('  ✅ 为 test 分配角色: USER');

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
  console.log('📋 测试账号信息:');
  console.log('  管理员: Admin / ll666888 (ADMIN + MODERATOR)');
  console.log('  普通用户: test / 123456A (USER)');
}

main()
  .catch((e) => {
    console.error('❌ 种子操作失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
