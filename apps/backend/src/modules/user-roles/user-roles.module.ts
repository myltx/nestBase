// src/modules/user-roles/user-roles.module.ts
/**
 * 用户-角色 关联模块
 * - 提供用户侧与角色侧的路由
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { UserRolesService } from './user-roles.service';
import { UserRolesUsersController } from './user-roles.users.controller';
import { UserRolesRolesController } from './user-roles.roles.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [UserRolesUsersController, UserRolesRolesController],
  providers: [UserRolesService],
  exports: [UserRolesService], // 导出服务供其他模块使用
})
export class UserRolesModule {}
