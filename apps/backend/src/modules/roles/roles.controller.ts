// src/modules/roles/roles.controller.ts
/**
 * 角色控制器
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取所有角色列表（支持分页）' })
  findAll(@Query() queryDto: QueryRoleDto) {
    return this.rolesService.findAll(queryDto);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取角色详情' })
  findOne(@Param('id') id: string, @Query('include') include?: string) {
    const includeRelations =
      include?.includes('menus') || include?.includes('permissions');
    return this.rolesService.findOne(id, includeRelations);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建新角色' })
  create(@Body() createDto: CreateRoleDto) {
    return this.rolesService.create(createDto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新角色' })
  update(@Param('id') id: string, @Body() updateDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除角色' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

}
