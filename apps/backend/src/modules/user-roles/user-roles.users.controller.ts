// src/modules/user-roles/user-roles.users.controller.ts
/**
 * 用户角色控制器（用户侧）
 * 提供用户角色查询和设置接口
 */
import { Controller, Get, Param, Put, Body, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { RateLimit } from '@common/decorators/rate-limit.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('用户模块')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserRolesUsersController {
  constructor(private readonly userRolesService: UserRolesService) {}

  @Get(':id/roles')
  @Roles('ADMIN')
  @RequirePermissions('user.read')
  @ApiOperation({ summary: '获取指定用户的角色列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async getUserRoles(@Param('id') id: string) {
    return this.userRolesService.getUserRoles(id);
  }

  @Put(':id/roles')
  @Roles('ADMIN')
  @RequirePermissions('user.update')
  @RateLimit({ key: 'user:setRoles', ttl: 60, limit: 10 })
  @ApiOperation({ summary: '设置用户角色（完全替换）' })
  @ApiResponse({ status: 200, description: '设置成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async setUserRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRolesDto,
    @CurrentUser() currentUser: any,
  ) {
    const actorId = currentUser?.id;
    return this.userRolesService.setUserRoles(id, dto.roleIds || [], actorId);
  }
}
