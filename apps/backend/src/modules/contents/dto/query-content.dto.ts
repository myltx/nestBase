// src/modules/contents/dto/query-content.dto.ts
/**
 * 查询内容 DTO
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsIn } from 'class-validator';
import { ContentStatus, EditorType } from '@prisma/client';

export class QueryContentDto {
  @ApiPropertyOptional({ description: '当前页码', example: '1', default: '1' })
  @IsString()
  @IsOptional()
  current?: string;

  @ApiPropertyOptional({ description: '每页数量', example: '10', default: '10' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ description: '搜索关键字（标题/摘要）', example: 'NestJS' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '内容状态', enum: ContentStatus, example: ContentStatus.PUBLISHED })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({ description: '编辑器类型', enum: EditorType, example: EditorType.MARKDOWN })
  @IsEnum(EditorType)
  @IsOptional()
  editorType?: EditorType;

  @ApiPropertyOptional({ description: '分类ID', example: 'category-uuid-123' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: '标签ID', example: 'tag-uuid-123' })
  @IsString()
  @IsOptional()
  tagId?: string;

  @ApiPropertyOptional({ description: '作者ID', example: 'user-uuid-123' })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({ description: '是否置顶', example: 'true' })
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  isTop?: string;

  @ApiPropertyOptional({ description: '是否推荐', example: 'true' })
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  isRecommend?: string;

  @ApiPropertyOptional({ description: 'Slug (URL标识符)', example: 'my-first-post' })
  @IsString()
  @IsOptional()
  slug?: string;
}
