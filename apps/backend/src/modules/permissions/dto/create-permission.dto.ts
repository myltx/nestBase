// src/modules/permissions/dto/create-permission.dto.ts
/**
 * 创建权限 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { PermissionType } from '@prisma/client';

export class CreatePermissionDto {
  @ApiProperty({
    description: '权限名称',
    example: '新增用户',
  })
  @IsString({ message: '权限名称必须是字符串' })
  name: string;

  @ApiProperty({
    description: '权限编码（唯一）',
    example: 'user:create',
  })
  @IsString({ message: '权限编码必须是字符串' })
  code: string;

  @ApiProperty({
    description: '权限类型',
    enum: PermissionType,
    example: PermissionType.BUTTON,
  })
  @IsEnum(PermissionType, { message: '权限类型必须是 MENU、BUTTON 或 API' })
  type: PermissionType;

  @ApiPropertyOptional({
    description: '所属菜单 ID（type 为 BUTTON 或 API 时必填）',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: '菜单 ID 必须是有效的 UUID' })
  menuId?: string;

  @ApiPropertyOptional({
    description: '权限描述',
    example: '允许新增用户',
  })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  description?: string;

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
