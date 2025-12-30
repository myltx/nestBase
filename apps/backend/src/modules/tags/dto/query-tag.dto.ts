// src/modules/tags/dto/query-tag.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTagDto {
  @ApiPropertyOptional({ description: '搜索关键词（标签名称）', example: 'NestJS' })
  @IsString()
  @IsOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: '标签名称', example: 'NestJS' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '排序方式', example: 'popular', enum: ['latest', 'popular'] })
  @IsString()
  @IsOptional()
  sort?: 'latest' | 'popular';

  @ApiPropertyOptional({ description: '页码', example: '1', default: '1' })
  @IsString()
  @IsOptional()
  current?: string;

  @ApiPropertyOptional({ description: '每页数量', example: '10', default: '10' })
  @IsString()
  @IsOptional()
  size?: string;
}
