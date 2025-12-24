/**
 * 批量删除角色 DTO
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, ArrayUnique, ArrayMaxSize } from 'class-validator';

export class BatchDeleteRolesDto {
  @ApiProperty({
    description: '角色 ID 列表',
    type: [String],
    example: ['role-uuid-1', 'role-uuid-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  ids: string[];
}
