// src/modules/roles/dto/assign-menus.dto.ts
/**
 * 为角色分配菜单 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignMenusDto {
  @ApiProperty({
    description: '菜单 ID 数组',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsArray({ message: '菜单 ID 必须是数组' })
  @IsUUID('4', { each: true, message: '每个菜单 ID 必须是有效的 UUID' })
  menuIds: string[];
}
