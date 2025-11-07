// src/modules/categories/dto/create-category.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称', example: '技术文章' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL标识符', example: 'tech-articles' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ description: '分类描述', example: '技术相关的文章' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '父分类ID', example: 'parent-uuid-123' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: '排序', example: 0, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(9999)
  order?: number;
}
