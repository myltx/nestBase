// src/modules/users/dto/update-user.dto.ts
/**
 * 更新用户 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, MinLength, IsArray, IsUrl } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
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
    description: '新密码',
    example: 'NewPassword123!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  password?: string;

  @ApiProperty({
    description: '用户角色数组（支持多角色）',
    enum: Role,
    isArray: true,
    example: [Role.USER, Role.MODERATOR],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true, message: '角色必须是 USER、ADMIN 或 MODERATOR' })
  roles?: Role[];

  @ApiProperty({
    description: '账户是否激活',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
