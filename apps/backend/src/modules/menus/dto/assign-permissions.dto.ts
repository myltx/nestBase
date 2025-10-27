// src/modules/menus/dto/assign-permissions.dto.ts
/**
 * 为菜单分配权限 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignMenuPermissionsDto {
  @ApiProperty({
    description: '权限 ID 数组',
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsArray({ message: '权限 ID 必须是数组' })
  @IsUUID('4', { each: true, message: '权限 ID 必须是有效的 UUID' })
  permissionIds: string[];
}
