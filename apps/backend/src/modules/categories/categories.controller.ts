// src/modules/categories/categories.controller.ts
/**
 * 分类控制器
 * 处理分类相关的 HTTP 请求
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, Public } from '@common/decorators';

@ApiTags('分类管理')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建分类（仅管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 409, description: '分类名称或slug已存在' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '查询所有分类（树形结构）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('flat')
  @Public()
  @ApiOperation({ summary: '查询所有分类（扁平列表）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAllFlat() {
    return this.categoriesService.findAllFlat();
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: '根据 slug 查询分类' })
  @ApiParam({ name: 'slug', description: 'URL标识符', example: 'tech-articles' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '根据 ID 查询分类' })
  @ApiParam({ name: 'id', description: '分类ID', example: 'category-uuid-123' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新分类（仅管理员）' })
  @ApiParam({ name: 'id', description: '分类ID', example: 'category-uuid-123' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '分类名称或slug已存在' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除分类（仅管理员）' })
  @ApiParam({ name: 'id', description: '分类ID', example: 'category-uuid-123' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '分类下有子分类或内容，无法删除' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
