// src/modules/menus/dto/query-menu.dto.ts
/**
 * 查询菜单 DTO
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, IsNumberString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryMenuDto {
  @ApiPropertyOptional({
    description: '搜索关键词（标题、路由标识）',
    example: 'home',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '是否只查询根菜单',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  rootOnly?: boolean;

  @ApiPropertyOptional({
    description: '是否只查询启用的菜单',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({
    description: '父菜单 ID',
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: '菜单类型 (1:目录 2:菜单)',
    example: 2,
  })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: '菜单类型必须是整数' })
  @Min(1, { message: '菜单类型必须是 1 或 2' })
  @Max(2, { message: '菜单类型必须是 1 或 2' })
  menuType?: number;

  @ApiPropertyOptional({
    description: '菜单状态 (1:启用 2:禁用)',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : (value ? parseInt(value, 10) : undefined))
  @IsInt({ message: '菜单状态必须是整数' })
  @Min(1, { message: '菜单状态必须是 1 或 2' })
  @Max(2, { message: '菜单状态必须是 1 或 2' })
  status?: number;

  @ApiPropertyOptional({
    description: '当前页码',
    example: 1,
  })
  @IsOptional()
  @IsNumberString()
  current?: string;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
  })
  @IsOptional()
  @IsNumberString()
  size?: string;
}
