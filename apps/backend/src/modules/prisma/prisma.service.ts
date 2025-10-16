// src/modules/prisma/prisma.service.ts
/**
 * Prisma 数据库服务
 * 提供统一的数据库连接管理和 Prisma Client 实例
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  /**
   * 模块初始化时连接数据库
   */
  async onModuleInit() {
    await this.$connect();
    console.log('✅ 数据库连接成功');
  }

  /**
   * 模块销毁时断开数据库连接
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 数据库连接已断开');
  }

  /**
   * 清理数据库（仅用于测试环境）
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('不能在生产环境中清理数据库');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && key[0] !== '_' && key[0] === key[0].toLowerCase(),
    );

    return Promise.all(models.map((modelKey) => this[modelKey].deleteMany()));
  }
}
