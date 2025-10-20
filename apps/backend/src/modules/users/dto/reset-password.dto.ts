// src/modules/users/dto/reset-password.dto.ts
/**
 * 重置密码 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class ResetPasswordDto {
  @ApiPropertyOptional({
    description: '新密码（可选，不提供则自动生成）',
    example: 'NewPassword123!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少 6 个字符' })
  newPassword?: string;
}
