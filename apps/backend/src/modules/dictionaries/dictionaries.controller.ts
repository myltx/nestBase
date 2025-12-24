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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DictionariesService } from './dictionaries.service';
import {
  CreateDictionaryDto,
  UpdateDictionaryDto,
  CreateDictionaryItemDto,
  UpdateDictionaryItemDto,
  QueryDictionaryDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles, Public } from '@common/decorators';

@ApiTags('基础数据模块')
@Controller('dictionaries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  // ==================== Dictionary Endpoints ====================

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: '创建字典（仅管理员）' })
  create(@Body() createDto: CreateDictionaryDto) {
    return this.dictionariesService.create(createDto);
  }

  @Get()
  @Public() // Or restrict to logged in users? Design implies admin config, but usage is public usually. Keeping safe with Roles for config, public for reading? 
  // Wait, standard CRUD usually requires auth. Let's stick to standard patterns: 
  // Reading dictionaries often needed by frontend. Let's make List Public or Authenticated?
  // Design says "Get dictionary by unique code (for frontend reading config)".
  // Let's make "Get by Code" Public. "List" might be Admin only or Auth.
  // The design doc in 4.1 doesn't specify auth, but "Context" says "admin configuration".
  // I will protect write operations with ADMIN. Read operations can be Public or Authenticated.
  // For safety, List is ADMIN (management). Get By Code is PUBLIC (usage).
  @Roles('ADMIN')
  @ApiOperation({ summary: '查询字典列表（仅管理员）' })
  findAll(@Query() query: QueryDictionaryDto) {
    return this.dictionariesService.findAll(query);
  }

  @Get('code/:code')
  @Public()
  @ApiOperation({ summary: '根据编码获取字典（公开，用于前端配置）' })
  @ApiParam({ name: 'code', description: '字典编码', example: 'user_gender' })
  findByCode(@Param('code') code: string) {
    return this.dictionariesService.findByCode(code);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取字典详情（仅管理员）' })
  findOne(@Param('id') id: string) {
    return this.dictionariesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新字典（仅管理员）' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDictionaryDto) {
    return this.dictionariesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: '删除字典（仅管理员）' })
  remove(@Param('id') id: string) {
    return this.dictionariesService.remove(id);
  }

  // ==================== Dictionary Item Endpoints ====================

  @Get(':id/items')
  @Public() // Items are often read-only for dropdowns
  @ApiOperation({ summary: '获取字典项列表' })
  getItems(@Param('id') dictionaryId: string) {
    return this.dictionariesService.getItems(dictionaryId);
  }

  @Post(':id/items')
  @Roles('ADMIN')
  @ApiOperation({ summary: '添加字典项（仅管理员）' })
  createItem(
    @Param('id') dictionaryId: string,
    @Body() createDto: CreateDictionaryItemDto,
  ) {
    return this.dictionariesService.createItem(dictionaryId, createDto);
  }

  @Patch(':id/items/:itemId')
  @Roles('ADMIN')
  @ApiOperation({ summary: '更新字典项（仅管理员）' })
  updateItem(
    @Param('id') dictionaryId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateDictionaryItemDto,
  ) {
    return this.dictionariesService.updateItem(dictionaryId, itemId, updateDto);
  }

  @Delete(':id/items/:itemId')
  @Roles('ADMIN')
  @ApiOperation({ summary: '移除字典项（仅管理员）' })
  removeItem(
    @Param('id') dictionaryId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.dictionariesService.removeItem(dictionaryId, itemId);
  }
}
