// src/modules/contents/dto/create-content.dto.ts
/**
 * 创建内容 DTO
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EditorType } from '@prisma/client';

export class CreateContentDto {
  @ApiProperty({ description: '标题', example: '我的第一篇文章' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'URL友好的标识符', example: 'my-first-article' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  slug: string;

  @ApiPropertyOptional({ description: '摘要/简介', example: '这是文章的简短描述' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  summary?: string;

  @ApiProperty({
    description: '编辑器类型',
    enum: EditorType,
    example: EditorType.MARKDOWN,
    default: EditorType.MARKDOWN,
  })
  @IsEnum(EditorType)
  @IsOptional()
  editorType?: EditorType;

  @ApiPropertyOptional({
    description: 'Markdown 原始内容（当 editorType=MARKDOWN 时必填）',
    example: '# 标题\n\n这是内容...',
  })
  @IsString()
  @IsOptional()
  contentMd?: string;

  @ApiPropertyOptional({
    description: 'HTML 内容（富文本编辑器使用或 Markdown 解析后）',
    example: '<h1>标题</h1><p>这是内容...</p>',
  })
  @IsString()
  @IsOptional()
  contentHtml?: string;

  @ApiPropertyOptional({
    description: '原始内容备份（富文本编辑器的原始数据）',
    example: '{"ops":[{"insert":"Hello World"}]}',
  })
  @IsString()
  @IsOptional()
  contentRaw?: string;

  @ApiPropertyOptional({ description: '封面图片URL', example: 'https://example.com/cover.jpg' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ description: '分类ID', example: 'category-uuid-123' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: '标签ID列表', example: ['tag-uuid-1', 'tag-uuid-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional({ description: '是否置顶', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isTop?: boolean;

  @ApiPropertyOptional({ description: '是否推荐', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isRecommend?: boolean;
}
