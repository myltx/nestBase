// prisma/seed.ts
// 数据库种子文件 - 用于初始化测试数据

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始数据库种子操作...');

  // 创建管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ 创建管理员用户:', admin);

  // 创建普通用户
  const userPassword = await bcrypt.hash('user123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      username: 'testuser',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isActive: true,
    },
  });

  console.log('✅ 创建普通用户:', user);
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
