// src/modules/user-roles/user-roles.roles.controller.ts
/**
 * 用户角色控制器（角色侧）
 * 提供角色用户管理接口：查询、批量添加、批量移除
 */
import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { BatchRoleUsersDto } from './dto/batch-role-users.dto';
import { GetRoleUsersQueryDto } from './dto/get-role-users.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { RateLimit } from '@common/decorators/rate-limit.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserRolesRolesController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get(':id/users')
  @Roles('ADMIN')
  @RequirePermissions('role.manage')
  @ApiOperation({ summary: '查看角色下的用户列表（支持分页和搜索）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async getUsers(@Param('id') id: string, @Query() query: GetRoleUsersQueryDto) {
    const { page = 1, pageSize = 20, search } = query;
    return this.userRolesService.getUsersByRole(id, page, pageSize, search);
  }

  @Post(':id/users')
  @Roles('ADMIN')
  @RequirePermissions('role.manage')
  @RateLimit({ key: 'role:addUsers', ttl: 60, limit: 5 })
  @ApiOperation({ summary: '批量将用户加入该角色' })
  @ApiResponse({ status: 200, description: '添加成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async addUsers(
    @Param('id') id: string,
    @Body() dto: BatchRoleUsersDto,
    @CurrentUser() currentUser: any,
  ) {
    const actorId = currentUser?.id;
    return this.userRolesService.addUsersToRole(id, dto.userIds, actorId);
  }

  @Delete(':id/users')
  @Roles('ADMIN')
  @RequirePermissions('role.manage')
  @RateLimit({ key: 'role:removeUsers', ttl: 60, limit: 5 })
  @ApiOperation({ summary: '批量将用户从该角色移除' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async removeUsers(
    @Param('id') id: string,
    @Body() dto: BatchRoleUsersDto,
    @CurrentUser() currentUser: any,
  ) {
    const actorId = currentUser?.id;
    return this.userRolesService.removeUsersFromRole(id, dto.userIds, actorId);
  }
}
