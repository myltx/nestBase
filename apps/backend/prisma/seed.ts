// prisma/seed.ts
// 数据库种子文件 - 用于初始化测试数据

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子操作...');

  // 清空现有用户数据
  console.log('🧹 清空现有用户数据...');
  await prisma.user.deleteMany({});

  // 创建管理员用户（拥有 ADMIN 和 MODERATOR 角色）
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      roles: [Role.ADMIN, Role.MODERATOR],
      isActive: true,
    },
  });

  console.log('✅ 创建管理员用户:', admin.email, '-', admin.roles);

  // 创建普通用户
  const userPassword = await bcrypt.hash('user123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      username: 'testuser',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
      roles: [Role.USER],
      isActive: true,
    },
  });

  console.log('✅ 创建普通用户:', user.email, '-', user.roles);

  // 创建协调员用户（拥有 MODERATOR 角色）
  const moderatorPassword = await bcrypt.hash('moderator123', 10);

  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@example.com',
      username: 'moderator',
      password: moderatorPassword,
      firstName: 'Moderator',
      lastName: 'User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator',
      roles: [Role.MODERATOR],
      isActive: true,
    },
  });

  console.log('✅ 创建协调员用户:', moderator.email, '-', moderator.roles);
  console.log('🎉 数据库种子操作完成！');
}

main()
  .catch((e) => {
    console.error('❌ 种子操作失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
