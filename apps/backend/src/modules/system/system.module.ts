// src/modules/system/system.module.ts
/**
 * 系统模块
 * 汇总系统级路由（如 /system/status）
 */
import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';

@Module({
  controllers: [SystemController],
})
export class SystemModule {}

