// src/modules/prisma/prisma.module.ts
/**
 * Prisma 模块
 * 全局导出 PrismaService，供其他模块使用
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
