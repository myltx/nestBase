// src/modules/logs/dto/query-access-log.dto.ts
/**
 * 查询访问日志 DTO
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAccessLogDto {
  @ApiPropertyOptional({ description: '用户ID', example: 'user-uuid-123' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'HTTP方法', example: 'GET' })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiPropertyOptional({ description: '请求路径（支持模糊搜索）', example: '/api/users' })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiPropertyOptional({ description: '状态码', example: 200 })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  statusCode?: number;

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
