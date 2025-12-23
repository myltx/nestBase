// src/modules/contents/dto/update-content.dto.ts
/**
 * 更新内容 DTO
 */
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateContentDto } from './create-content.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ContentStatus } from '@prisma/client';

export class UpdateContentDto extends PartialType(CreateContentDto) {
  @ApiPropertyOptional({ description: '内容状态', enum: ContentStatus })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiPropertyOptional({ description: '是否置顶' })
  @IsBoolean()
  @IsOptional()
  isTop?: boolean;

  @ApiPropertyOptional({ description: '是否推荐' })
  @IsBoolean()
  @IsOptional()
  isRecommend?: boolean;
}
