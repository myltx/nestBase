// src/modules/contents/contents.controller.ts
/**
 * 内容控制器
 * 处理内容相关的 HTTP 请求
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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ContentsService } from './contents.service';
import {
  CreateContentDto,
  UpdateContentDto,
  QueryContentDto,
  BatchDeleteContentsDto,
} from './dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles, CurrentUser, Public } from '@common/decorators';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@ApiTags('内容管理')
@Controller('contents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Post()
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: '创建内容' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 409, description: 'slug 已存在' })
  create(@Body() createContentDto: CreateContentDto, @CurrentUser() user: any) {
    return this.contentsService.create(createContentDto, user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '查询所有内容（支持分页和搜索）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() queryDto: QueryContentDto) {
    return this.contentsService.findAll(queryDto);
  }



  @Get(':id')
  @Public()
  @ApiOperation({ summary: '根据 ID 查询内容' })
  @ApiParam({ name: 'id', description: '内容ID', example: 'content-uuid-123' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '内容不存在' })
  findOne(@Param('id') id: string, @Query('view') view?: string) {
    const incrementView = view === 'true';
    return this.contentsService.findOne(id, incrementView);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MODERATOR')
  @ApiOperation({ summary: '更新内容' })
  @ApiParam({ name: 'id', description: '内容ID', example: 'content-uuid-123' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '内容不存在' })
  @ApiResponse({ status: 409, description: 'slug 已存在' })
  update(@Param('id') id: string, @Body() updateContentDto: UpdateContentDto) {
    return this.contentsService.update(id, updateContentDto);
  }

  @Delete(':id')
  @RequirePermissions('content.delete')
  @ApiOperation({ summary: '删除内容' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string) {
    return this.contentsService.remove(id);
  }

  @Post('batch-delete')
  @RequirePermissions('content.delete')
  @ApiOperation({ summary: '批量删除内容' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchRemove(@Body() dto: BatchDeleteContentsDto) {
    return this.contentsService.batchRemove(dto.ids);
  }
}
