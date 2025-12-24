/**
 * 批量删除内容 DTO
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, ArrayUnique, ArrayMaxSize } from 'class-validator';

export class BatchDeleteContentsDto {
  @ApiProperty({
    description: '内容 ID 列表',
    type: [String],
    example: ['content-uuid-1', 'content-uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  ids: string[];
}
