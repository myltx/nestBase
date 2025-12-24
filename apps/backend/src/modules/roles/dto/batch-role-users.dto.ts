/**
 * 角色批量关联/移除用户 DTO
 * - 用于角色管理页：编辑角色 → 批量添加/移除用户
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString, ArrayUnique, ArrayMaxSize } from 'class-validator';

export class BatchRoleUsersDto {
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
  userIds: string[];
}
