// prisma/prepare-migration.ts
/**
 * 准备数据库迁移：
 * 1. 将旧的 menus 表改名为 menus_old
 * 2. 将旧的 role_menus 表改名为 role_menus_old
 * 3. 将旧的 permissions 表改名为 permissions_old
 * 4. 将旧的 role_permissions 表改名为 role_permissions_old
 *
 * 这样就可以安全地创建新表而不会丢失数据
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('========================================');
  console.log('🔄 准备数据库迁移');
  console.log('========================================');
  console.log('');

  console.log('📦 步骤 1: 备份旧表...');

  try {
    // 1. 重命名 menus 表
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS menus RENAME TO menus_old;
    `);
    console.log('  ✅ menus → menus_old');

    // 2. 重命名 role_menus 表
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS role_menus RENAME TO role_menus_old;
    `);
    console.log('  ✅ role_menus → role_menus_old');

    // 3. 重命名 permissions 表
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS permissions RENAME TO permissions_old;
    `);
    console.log('  ✅ permissions → permissions_old');

    // 4. 重命名 role_permissions 表
    await prisma.$executeRawUnsafe(`
      ALTER TABLE IF EXISTS role_permissions RENAME TO role_permissions_old;
    `);
    console.log('  ✅ role_permissions → role_permissions_old');

    console.log('');
    console.log('✅ 旧表备份完成！');
    console.log('');
    console.log('💡 下一步:');
    console.log('  1. 运行: npx prisma db push');
    console.log('  2. 运行: npx ts-node prisma/migrate-to-unified-permissions.ts');
    console.log('  3. 运行: pnpm prisma:seed');
    console.log('');
  } catch (error) {
    console.error('❌ 备份失败:', error);
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
