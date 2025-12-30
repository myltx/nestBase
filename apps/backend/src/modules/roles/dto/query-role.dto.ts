// src/modules/roles/dto/query-role.dto.ts
/**
 * 查询角色 DTO
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsNumberString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryRoleDto {
  @ApiPropertyOptional({
    description: '搜索关键词（角色代码、名称）',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '角色代码',
    example: 'ADMIN',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: '角色名称',
    example: '管理员',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '是否为系统角色',
    example: 'true',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isSystem?: boolean;

  @ApiPropertyOptional({
    description: '角色状态 (1:启用 2:禁用)',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value ? parseInt(value, 10) : undefined))
  @IsInt({ message: '角色状态必须是整数' })
  @Min(1, { message: '角色状态必须是 1 或 2' })
  @Max(2, { message: '角色状态必须是 1 或 2' })
  status?: number;

  @ApiPropertyOptional({
    description: '当前页码',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumberString()
  current?: string;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumberString()
  size?: string;
}
