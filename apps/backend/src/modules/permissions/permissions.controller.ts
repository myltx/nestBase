// src/modules/permissions/permissions.controller.ts
/**
 * 权限控制器
 * 处理权限相关的 HTTP 请求
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('权限管理')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建权限（仅管理员）' })
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @ApiOperation({ summary: '查询所有权限（分页）' })
  findAll(@Query() queryDto: QueryPermissionDto) {
    return this.permissionsService.findAll(queryDto);
  }

  @Get('by-resource')
  @ApiOperation({ summary: '按资源分组查询权限' })
  findByResource() {
    return this.permissionsService.findByResource();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 查询权限' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新权限（仅管理员）' })
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除权限（仅管理员）' })
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
