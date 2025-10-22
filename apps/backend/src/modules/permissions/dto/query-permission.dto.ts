// src/modules/permissions/dto/query-permission.dto.ts
/**
 * 查询权限 DTO
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, Transform } from 'class-validator';

export class QueryPermissionDto {
  @ApiPropertyOptional({
    description: '搜索关键字（权限代码、名称、资源）',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '资源名称筛选',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({
    description: '操作类型筛选',
    example: 'create',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: '是否只查询启用的权限',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  activeOnly?: boolean;

  @ApiPropertyOptional({
    description: '当前页码',
    example: '1',
    default: '1',
  })
  @IsOptional()
  @IsString()
  current?: string;

  @ApiPropertyOptional({
    description: '每页数量',
    example: '10',
    default: '10',
  })
  @IsOptional()
  @IsString()
  size?: string;
}
