// src/modules/audit/dto/query-audit-log.dto.ts
/**
 * 查询审计日志的 DTO
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogDto {
  @ApiPropertyOptional({ description: '当前页码', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  current?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  size?: number = 20;

  @ApiPropertyOptional({ description: '事件名称（模糊搜索）', example: 'role:update' })
  @IsString()
  @IsOptional()
  event?: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: '资源类型', example: 'Role' })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ description: '开始日期', example: '2025-01-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2025-12-31T23:59:59.999Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
