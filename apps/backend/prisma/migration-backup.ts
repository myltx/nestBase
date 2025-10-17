// prisma/migration-backup.ts
// 迁移脚本 - 保存用户数据用于恢复

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupUsers() {
  console.log('🔄 开始备份用户数据...');

  const users = await prisma.$queryRaw`
    SELECT * FROM users
  `;

  const backupData = {
    users,
    timestamp: new Date().toISOString(),
  };

  const backupPath = path.join(__dirname, 'user-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

  console.log(`✅ 用户数据已备份到: ${backupPath}`);
  console.log(`📊 备份了 ${(users as any[]).length} 个用户`);

  return users;
}

backupUsers()
  .catch((e) => {
    console.error('❌ 备份失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
