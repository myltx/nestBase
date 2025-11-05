// src/modules/menus/menus.controller.ts
/**
 * 菜单控制器
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { CreateMenuDto, UpdateMenuDto, QueryMenuDto } from './dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { GetUser } from '@common/decorators/get-user.decorator';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('菜单管理')
@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建菜单' })
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: '查询所有菜单' })
  findAll(@Query() queryDto: QueryMenuDto) {
    return this.menusService.findAll(queryDto);
  }

  @Get('tree')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取树形菜单结构' })
  findTree(@Query('activeOnly') activeOnly?: string, @Query('constantOnly') constantOnly?: string) {
    // 解析 constantOnly 参数：'true' -> true, 'false' -> false, undefined -> undefined
    let constantOnlyBool: boolean | undefined;
    if (constantOnly === 'true') {
      constantOnlyBool = true;
    } else if (constantOnly === 'false') {
      constantOnlyBool = false;
    }

    return this.menusService.findTree(activeOnly === 'true', constantOnlyBool);
  }

  @Get('constant-routes')
  @ApiOperation({ summary: '获取常量菜单路由' })
  // @Public()
  getConstantRoutes() {
    return this.menusService.findConstantMenus();
  }

  @Get('user-routes')
  @ApiOperation({ summary: '获取当前用户的路由菜单' })
  getUserRoutes(@GetUser() user: any) {
    return this.menusService.findByRoles(user.roles);
  }

  @Get('route-names')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取所有菜单的路由名称列表' })
  getAllRouteNames() {
    return this.menusService.getAllRouteNames();
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '根据 ID 查询菜单' })
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新菜单' })
  update(@Param('id') id: string, @Body() updateMenuDto: UpdateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除菜单' })
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}
