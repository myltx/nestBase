// src/modules/users/dto/query-user.dto.ts
/**
 * 查询用户 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender } from '@prisma/client';

export class QueryUserDto {
  @ApiPropertyOptional({
    description: '搜索关键词（用户名、邮箱、名字、姓氏）',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '用户名筛选',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({
    description: '邮箱筛选',
    example: 'admin@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: '昵称筛选（模糊匹配）',
    example: '小明',
  })
  @IsOptional()
  @IsString()
  nickName?: string;

  @ApiPropertyOptional({
    description: '性别筛选',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender, { message: '性别必须是 MALE, FEMALE 或 UNKNOWN' })
  gender?: Gender;

  @ApiPropertyOptional({
    description: '手机号筛选（精确匹配）',
    example: '13800138000',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: '用户状态筛选 (1:启用 2:禁用)',
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value ? parseInt(value, 10) : undefined))
  @IsInt({ message: '用户状态必须是整数' })
  @Min(1, { message: '用户状态必须是 1 或 2' })
  @Max(2, { message: '用户状态必须是 1 或 2' })
  status?: number;

  @ApiPropertyOptional({
    description: '角色代码筛选(如 ADMIN, USER, MODERATOR)',
    example: 'USER',
  })
  @IsOptional()
  @IsString()
  role?: string;

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
