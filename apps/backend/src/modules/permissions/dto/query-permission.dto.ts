// src/modules/permissions/dto/query-permission.dto.ts
/**
 * 查询权限 DTO
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PermissionType } from '@prisma/client';

export class QueryPermissionDto {
  @ApiPropertyOptional({
    description: '搜索关键字（权限代码、名称）',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '权限类型筛选',
    enum: PermissionType,
    example: PermissionType.BUTTON,
  })
  @IsOptional()
  @IsEnum(PermissionType)
  type?: PermissionType;

  @ApiPropertyOptional({
    description: '所属菜单 ID 筛选',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  menuId?: string;

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
