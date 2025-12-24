/**
 * 批量删除用户 DTO
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, ArrayUnique, ArrayMaxSize } from 'class-validator';

export class BatchDeleteUsersDto {
  @ApiProperty({
    description: '用户 ID 列表',
    type: [String],
    example: ['user-uuid-1', 'user-uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  ids: string[];
}
