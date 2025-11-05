// src/modules/user-roles/dto/update-user-roles.dto.ts
/**
 * 更新用户角色 DTO
 * 用于用户管理页：编辑用户 → 修改角色
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayUnique, ArrayMaxSize } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: '角色 ID 列表',
    type: [String],
    example: ['role-uuid-1', 'role-uuid-2'],
  })
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(50, { message: '最多可设置 50 个角色' })
  @IsString({ each: true })
  roleIds: string[];
}
