import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LoginStatus } from '@prisma/client';

export class QueryLogDto {
  @ApiPropertyOptional({ description: '日志类型', enum: ['ACCESS', 'LOGIN'] })
  @IsEnum(['ACCESS', 'LOGIN'])
  @IsOptional()
  type?: 'ACCESS' | 'LOGIN';

  @ApiPropertyOptional({ description: '用户ID', example: 'uuid' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'IP地址', example: '127.0.0.1' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ description: '开始时间', example: '2023-01-01' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束时间', example: '2023-12-31' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', example: '1', default: '1' })
  @IsString()
  @IsOptional()
  current?: string;

  @ApiPropertyOptional({ description: '每页数量', example: '10', default: '10' })
  @IsString()
  @IsOptional()
  size?: string;

  // Access Log specific
  @ApiPropertyOptional({ description: 'HTTP方法', example: 'GET' })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiPropertyOptional({ description: '请求路径', example: '/api/v1/users' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: '状态码', example: 200 })
  @IsOptional()
  statusCode?: number;

  // Login Log specific
  @ApiPropertyOptional({ description: '邮箱', example: 'user@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: '登录状态', enum: LoginStatus })
  @IsOptional()
  status?: LoginStatus;
}
