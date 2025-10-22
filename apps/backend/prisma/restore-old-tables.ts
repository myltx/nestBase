// prisma/restore-old-tables.ts
/**
 * 恢复旧的表结构
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 开始恢复旧表...');

  try {
    // 1. 将 menus_old 重命名回 menus
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS menus_old RENAME TO menus;
    `);
    console.log('✅ menus 表已恢复');

    // 2. 将 role_menus_old 重命名回 role_menus
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS role_menus_old RENAME TO role_menus;
    `);
    console.log('✅ role_menus 表已恢复');

    // 3. 将 permissions_old 重命名回 permissions
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS permissions_old RENAME TO permissions;
    `);
    console.log('✅ permissions 表已恢复');

    // 4. 将 role_permissions_old 重命名回 role_permissions
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS role_permissions_old RENAME TO role_permissions;
    `);
    console.log('✅ role_permissions 表已恢复');

    console.log('');
    console.log('🎉 所有表已恢复！');
  } catch (error) {
    console.error('❌ 恢复失败:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
