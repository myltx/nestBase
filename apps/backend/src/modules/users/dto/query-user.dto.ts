// src/modules/users/dto/query-user.dto.ts
/**
 * 查询用户 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { Role } from '@prisma/client';

export class QueryUserDto {
  @ApiProperty({
    description: '搜索关键词（用户名或邮箱）',
    required: false,
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '角色筛选',
    enum: Role,
    required: false,
    example: Role.USER,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    description: '页码',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({
    description: '每页数量',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
