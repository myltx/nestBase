// src/modules/users/users.controller.ts
/**
 * 用户控制器
 * 处理用户相关的 HTTP 请求
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto, ResetPasswordDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, CurrentUser } from '@common/decorators';

@ApiTags('用户模块')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建用户（仅管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 409, description: '邮箱或用户名已存在' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '查询所有用户（支持分页和搜索）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  findAll(@Query() queryDto: QueryUserDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 查询用户' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新用户信息（仅管理员）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser?.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除用户（仅管理员）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: '重置用户密码（仅管理员）' })
  @ApiResponse({ status: 200, description: '重置成功，返回新密码' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  resetPassword(@Param('id') id: string, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, resetPasswordDto);
  }
}
