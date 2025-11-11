// src/modules/contents/dto/update-content.dto.ts
/**
 * 更新内容 DTO
 */
import { PartialType } from '@nestjs/swagger';
import { CreateContentDto } from './create-content.dto';

export class UpdateContentDto extends PartialType(CreateContentDto) {}
