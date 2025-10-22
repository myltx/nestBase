// src/modules/permissions/dto/create-permission.dto.ts
/**
 * 创建权限 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: '权限代码',
    example: 'user.create',
  })
  @IsString({ message: '权限代码必须是字符串' })
  code: string;

  @ApiProperty({
    description: '权限名称',
    example: '创建用户',
  })
  @IsString({ message: '权限名称必须是字符串' })
  name: string;

  @ApiPropertyOptional({
    description: '权限描述',
    example: '允许创建新用户',
  })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;

  @ApiProperty({
    description: '资源名称',
    example: 'user',
  })
  @IsString({ message: '资源名称必须是字符串' })
  resource: string;

  @ApiProperty({
    description: '操作类型',
    example: 'create',
  })
  @IsString({ message: '操作类型必须是字符串' })
  action: string;

  @ApiPropertyOptional({
    description: '权限状态 (1:启用 2:禁用)',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: '权限状态必须是整数' })
  @Min(1, { message: '权限状态必须是 1 或 2' })
  @Max(2, { message: '权限状态必须是 1 或 2' })
  status?: number;
}
