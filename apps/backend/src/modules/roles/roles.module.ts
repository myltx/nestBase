// src/modules/roles/roles.module.ts
/**
 * 角色模块
 */

import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RoleUsersController } from './role-users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RedisModule } from '@modules/redis/redis.module';

@Module({
  imports: [PrismaModule, AuditModule, RedisModule],
  controllers: [RolesController, RoleUsersController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
