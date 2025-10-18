// src/modules/auth/dto/login.dto.ts
/**
 * 用户登录 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '用户名或邮箱',
    example: 'testuser',
  })
  @IsString()
  userName: string;

  @ApiProperty({
    description: '密码',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  password: string;
}
