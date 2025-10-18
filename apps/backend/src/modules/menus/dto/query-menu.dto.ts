// src/modules/menus/dto/query-menu.dto.ts
/**
 * 查询菜单 DTO
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';
import { MenuStatus } from '@prisma/client';

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
    description: '菜单状态',
    enum: MenuStatus,
    example: MenuStatus.ENABLED,
  })
  @IsOptional()
  @IsEnum(MenuStatus, { message: '菜单状态必须是有效的枚举值' })
  status?: MenuStatus;

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
