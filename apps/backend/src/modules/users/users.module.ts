// src/modules/users/users.module.ts
/**
 * 用户模块
 */

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRolesController } from './user-roles.controller';
import { AuditModule } from '../audit/audit.module';
import { RedisModule } from '@modules/redis/redis.module';

@Module({
  imports: [AuditModule, RedisModule],
  controllers: [UsersController, UserRolesController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
