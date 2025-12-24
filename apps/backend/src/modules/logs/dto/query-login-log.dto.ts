// src/modules/logs/dto/query-login-log.dto.ts
/**
 * 查询登录日志 DTO
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { LoginStatus } from '@prisma/client';

export class QueryLoginLogDto {
  @ApiPropertyOptional({ description: '用户ID', example: 'user-uuid-123' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'user@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: '登录状态',
    enum: LoginStatus,
    example: LoginStatus.SUCCESS
  })
  @IsEnum(LoginStatus)
  @IsOptional()
  status?: LoginStatus;

  @ApiPropertyOptional({ description: 'IP地址', example: '127.0.0.1' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ description: '开始时间', example: '2025-01-01T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束时间', example: '2025-12-31T23:59:59.999Z' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '当前页码', example: '1', default: '1' })
  @IsString()
  @IsOptional()
  current?: string;

  @ApiPropertyOptional({ description: '每页数量', example: '10', default: '10' })
  @IsString()
  @IsOptional()
  size?: string;
}
