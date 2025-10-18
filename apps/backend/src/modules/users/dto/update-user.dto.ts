// src/modules/users/dto/update-user.dto.ts
/**
 * 更新用户 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUrl, IsUUID, IsEnum, IsInt, Min, Max, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    description: '昵称',
    example: '小明',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickName?: string;

  @ApiProperty({
    description: '名字',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: '姓氏',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: '性别',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender, { message: '性别必须是 MALE, FEMALE 或 OTHER' })
  gender?: Gender;

  @ApiProperty({
    description: '用户头像 URL',
    example: 'https://avatar.example.com/user.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '头像必须是有效的 URL' })
  avatar?: string;

  @ApiProperty({
    description: '新密码',
    example: 'NewPassword123!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  password?: string;

  @ApiProperty({
    description: '角色 ID 数组(支持多角色)',
    type: [String],
    example: ['uuid1', 'uuid2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: '每个角色 ID 必须是有效的 UUID' })
  roleIds?: string[];

  @ApiProperty({
    description: '用户状态 (1:启用 2:禁用)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: '用户状态必须是整数' })
  @Min(1, { message: '用户状态必须是 1 或 2' })
  @Max(2, { message: '用户状态必须是 1 或 2' })
  status?: number;
}
