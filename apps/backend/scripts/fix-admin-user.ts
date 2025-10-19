// scripts/fix-admin-user.ts
// 修复管理员用户 - 删除 Admin，将 admin 改为管理员权限

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 开始修复管理员用户...');

  // 1. 查找并删除 "Admin" 用户
  console.log('\n📋 步骤 1: 查找用户 "Admin"');
  const adminUser = await prisma.user.findUnique({
    where: { userName: 'Admin' },
    include: { userRoles: true },
  });

  if (adminUser) {
    console.log(`  ✅ 找到用户: Admin (ID: ${adminUser.id})`);
    console.log(`     - Email: ${adminUser.email}`);
    console.log(`     - 角色数: ${adminUser.userRoles.length}`);

    // 删除用户（级联删除会自动删除 userRoles）
    await prisma.user.delete({
      where: { id: adminUser.id },
    });
    console.log('  ✅ 已删除用户 "Admin"');
  } else {
    console.log('  ℹ️  用户 "Admin" 不存在，跳过删除');
  }

  // 2. 查找 "admin" 用户
  console.log('\n📋 步骤 2: 查找用户 "admin"');
  const admin = await prisma.user.findUnique({
    where: { userName: 'admin' },
    include: { userRoles: { include: { role: true } } },
  });

  if (!admin) {
    console.log('  ❌ 用户 "admin" 不存在！');
    console.log('  💡 请先创建 admin 用户');
    return;
  }

  console.log(`  ✅ 找到用户: admin (ID: ${admin.id})`);
  console.log(`     - Email: ${admin.email}`);
  console.log(`     - 当前角色: ${admin.userRoles.map(ur => ur.role.code).join(', ') || '无'}`);

  // 3. 查找 ADMIN 和 MODERATOR 角色
  console.log('\n📋 步骤 3: 查找管理员角色');
  const [adminRole, moderatorRole] = await Promise.all([
    prisma.role.findUnique({ where: { code: 'ADMIN' } }),
    prisma.role.findUnique({ where: { code: 'MODERATOR' } }),
  ]);

  if (!adminRole || !moderatorRole) {
    console.log('  ❌ 找不到 ADMIN 或 MODERATOR 角色！');
    return;
  }

  console.log(`  ✅ 找到角色: ADMIN (ID: ${adminRole.id})`);
  console.log(`  ✅ 找到角色: MODERATOR (ID: ${moderatorRole.id})`);

  // 4. 清除 admin 用户的现有角色
  console.log('\n📋 步骤 4: 清除 admin 用户的现有角色');
  await prisma.userRole.deleteMany({
    where: { userId: admin.id },
  });
  console.log('  ✅ 已清除现有角色');

  // 5. 为 admin 用户添加 ADMIN 和 MODERATOR 角色
  console.log('\n📋 步骤 5: 为 admin 用户添加管理员角色');
  await prisma.userRole.createMany({
    data: [
      { userId: admin.id, roleId: adminRole.id },
      { userId: admin.id, roleId: moderatorRole.id },
    ],
  });
  console.log('  ✅ 已添加 ADMIN 和 MODERATOR 角色');

  // 6. 验证结果
  console.log('\n📋 步骤 6: 验证结果');
  const updatedAdmin = await prisma.user.findUnique({
    where: { id: admin.id },
    include: { userRoles: { include: { role: true } } },
  });

  console.log('  ✅ 更新后的 admin 用户信息:');
  console.log(`     - 用户名: ${updatedAdmin?.userName}`);
  console.log(`     - Email: ${updatedAdmin?.email}`);
  console.log(`     - 角色: ${updatedAdmin?.userRoles.map(ur => ur.role.code).join(', ')}`);

  console.log('\n🎉 管理员用户修复完成!');
  console.log('\n📋 最终结果:');
  console.log('  ✅ 删除了用户 "Admin"');
  console.log('  ✅ 为用户 "admin" 添加了 ADMIN 和 MODERATOR 角色');
}

main()
  .catch((e) => {
    console.error('❌ 操作失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
