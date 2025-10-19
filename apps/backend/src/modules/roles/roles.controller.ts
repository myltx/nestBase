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
import { AssignMenusDto, CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
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
  @ApiOperation({ summary: '获取所有角色列表' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('page')
  @Roles('ADMIN')
  @ApiOperation({ summary: '分页查询角色列表' })
  findPage(@Query() queryDto: QueryRoleDto) {
    return this.rolesService.findPage(queryDto);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取角色详情' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
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

  @Post(':id/menus')
  @Roles('ADMIN')
  @ApiOperation({ summary: '为角色分配菜单' })
  assignMenus(@Param('id') id: string, @Body() assignDto: AssignMenusDto) {
    return this.rolesService.assignMenus(id, assignDto);
  }

  @Get(':id/menus')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取角色的菜单列表' })
  getRoleMenus(@Param('id') id: string) {
    return this.rolesService.getRoleMenus(id);
  }

  @Get(':id/stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取角色统计信息' })
  getRoleStats(@Param('id') id: string) {
    return this.rolesService.getRoleStats(id);
  }

  @Get(':id/users/count')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取角色关联的用户数量' })
  getRoleUserCount(@Param('id') id: string) {
    return this.rolesService.getRoleUserCount(id);
  }

  @Get(':id/menus/count')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取角色关联的菜单数量' })
  getRoleMenuCount(@Param('id') id: string) {
    return this.rolesService.getRoleMenuCount(id);
  }
}
