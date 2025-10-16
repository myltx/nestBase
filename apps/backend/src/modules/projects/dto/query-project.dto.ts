import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsBoolean,
  IsEnum,
} from 'class-validator';

/**
 * 排序方式枚举
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * 排序字段枚举
 */
export enum ProjectSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

/**
 * 查询项目 DTO
 */
export class QueryProjectDto {
  @ApiPropertyOptional({
    description: '页码',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    minimum: 1,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '搜索关键词（标题、描述）',
    example: '博客',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '是否只显示精选项目',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    description: '技术栈筛选',
    example: 'TypeScript',
  })
  @IsOptional()
  @IsString()
  tech?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: ProjectSortField,
    default: ProjectSortField.CREATED_AT,
    example: ProjectSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ProjectSortField)
  sortBy?: ProjectSortField = ProjectSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: '排序方式',
    enum: SortOrder,
    default: SortOrder.DESC,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
