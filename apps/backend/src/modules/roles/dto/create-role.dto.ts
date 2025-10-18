// src/modules/roles/dto/create-role.dto.ts
/**
 * 创建角色 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, MinLength, MaxLength } from 'class-validator';
import { RoleStatus } from '@prisma/client';

export class CreateRoleDto {
  @ApiProperty({
    description: '角色代码(唯一标识,大写字母+下划线)',
    example: 'CUSTOM_ROLE',
  })
  @IsString()
  @MinLength(2, { message: '角色代码至少 2 个字符' })
  @MaxLength(50, { message: '角色代码最多 50 个字符' })
  code: string;

  @ApiProperty({
    description: '角色名称',
    example: '自定义角色',
  })
  @IsString()
  @MinLength(2, { message: '角色名称至少 2 个字符' })
  @MaxLength(50, { message: '角色名称最多 50 个字符' })
  name: string;

  @ApiProperty({
    description: '角色描述',
    example: '这是一个自定义角色',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '是否为系统内置角色(系统角色不可删除)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({
    description: '角色状态',
    enum: RoleStatus,
    example: RoleStatus.ENABLED,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleStatus, { message: '角色状态必须是 ENABLED 或 DISABLED' })
  status?: RoleStatus;
}
