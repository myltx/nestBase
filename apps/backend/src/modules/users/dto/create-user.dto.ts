// src/modules/users/dto/create-user.dto.ts
/**
 * 创建用户 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsArray, IsUrl } from 'class-validator';
import { Role } from '@prisma/client';

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
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;

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
    description: '用户头像 URL',
    example: 'https://avatar.example.com/user.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '头像必须是有效的 URL' })
  avatar?: string;

  @ApiProperty({
    description: '用户角色数组（支持多角色）',
    enum: Role,
    isArray: true,
    example: [Role.USER],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true, message: '角色必须是 USER、ADMIN 或 MODERATOR' })
  roles?: Role[];
}
