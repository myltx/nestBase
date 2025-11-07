// src/modules/tags/tags.controller.ts
/**
 * 标签控制器
 * 处理标签相关的 HTTP 请求
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
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto, QueryTagDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, Public } from '@common/decorators';

@ApiTags('标签管理')
@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建标签（仅管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 409, description: '标签名称或slug已存在' })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Post('batch')
  @Roles('ADMIN')
  @ApiOperation({ summary: '批量创建标签（仅管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  createMany(@Body() tags: CreateTagDto[]) {
    return this.tagsService.createMany(tags);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '查询所有标签' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('page')
  @Public()
  @ApiOperation({ summary: '分页查询标签（支持搜索）' })
  @ApiQuery({ name: 'current', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'size', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词（标签名称）', example: 'NestJS' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(@Query() queryDto: QueryTagDto) {
    return this.tagsService.findPage(queryDto);
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: '查询热门标签（按内容数量排序）' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量', example: 10 })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPopular(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.tagsService.findPopular(limitNum);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: '根据 slug 查询标签' })
  @ApiParam({ name: 'slug', description: 'URL标识符', example: 'nestjs' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  findBySlug(@Param('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '根据 ID 查询标签' })
  @ApiParam({ name: 'id', description: '标签ID', example: 'tag-uuid-123' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新标签（仅管理员）' })
  @ApiParam({ name: 'id', description: '标签ID', example: 'tag-uuid-123' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @ApiResponse({ status: 409, description: '标签名称或slug已存在' })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除标签（仅管理员）' })
  @ApiParam({ name: 'id', description: '标签ID', example: 'tag-uuid-123' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '标签下有内容，无法删除' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }
}
