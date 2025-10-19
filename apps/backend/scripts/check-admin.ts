// scripts/check-admin.ts
// 检查 admin 用户的角色

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 检查 admin 用户信息...\n');

  const admin = await prisma.user.findUnique({
    where: { userName: 'admin' },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    },
  });

  if (!admin) {
    console.log('❌ 用户 "admin" 不存在！');
    return;
  }

  console.log('✅ 用户信息:');
  console.log(`   用户名: ${admin.userName}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   昵称: ${admin.nickName || '未设置'}`);
  console.log(`   状态: ${admin.status === 1 ? '启用' : '禁用'}`);
  console.log('');
  console.log('✅ 角色信息:');
  if (admin.userRoles.length === 0) {
    console.log('   ⚠️  无角色');
  } else {
    admin.userRoles.forEach((ur, index) => {
      console.log(`   ${index + 1}. ${ur.role.name} (${ur.role.code})`);
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ 检查失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
