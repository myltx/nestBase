// src/modules/roles/dto/create-role.dto.ts
/**
 * 创建角色 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';

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
    description: '角色默认首页路由(不需要前导斜杠)',
    example: 'home',
    required: false,
    default: 'home',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '首页路由不能为空' })
  home?: string;

  // isSystem 字段不允许通过 API 设置，只能在数据库层面或系统初始化时设置
  // 系统角色只能通过数据库迁移或种子数据创建
  // @ApiProperty({
  //   description: '是否为系统内置角色(系统角色不可删除)',
  //   example: false,
  //   required: false,
  // })
  // @IsOptional()
  // @IsBoolean()
  // isSystem?: boolean;

  @ApiProperty({
    description: '角色状态 (1:启用 2:禁用)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '角色状态必须是整数' })
  @Min(1, { message: '角色状态必须是 1 或 2' })
  @Max(2, { message: '角色状态必须是 1 或 2' })
  status?: number;
}
