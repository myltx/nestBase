// src/modules/users/dto/create-user.dto.ts
/**
 * 创建用户 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsArray, IsUrl, IsUUID, IsEnum, IsMobilePhone } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({
    description: '用户名',
    example: 'testuser',
  })
  @IsString()
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(20, { message: '用户名最多 20 个字符' })
  userName: string;

  @ApiProperty({
    description: '密码（可选，不提供则自动生成）',
    example: 'Password123!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  password?: string;

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
    description: '角色 ID 数组(支持多角色)',
    type: [String],
    example: ['uuid1', 'uuid2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: '每个角色 ID 必须是有效的 UUID' })
  roleIds?: string[];
}
