// src/modules/contents/dto/publish-content.dto.ts
/**
 * 发布内容 DTO
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class PublishContentDto {
  @ApiPropertyOptional({
    description: '发布时间（不填则使用当前时间）',
    example: '2025-01-07T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;
}
