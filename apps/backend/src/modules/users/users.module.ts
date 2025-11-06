// src/modules/users/users.module.ts
/**
 * 用户模块
 */

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserRolesModule } from '../user-roles/user-roles.module';

@Module({
  imports: [UserRolesModule], // 导入 UserRolesModule 以使用 UserRolesService
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
