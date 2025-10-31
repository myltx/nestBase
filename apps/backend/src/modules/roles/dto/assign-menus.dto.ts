// src/modules/roles/dto/assign-menus.dto.ts
/**
 * 为角色分配菜单 DTO
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsOptional, IsString, MinLength } from 'class-validator';

export class AssignMenusDto {
  @ApiProperty({
    description: '菜单 ID 数组',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsArray({ message: '菜单 ID 必须是数组' })
  @IsUUID('4', { each: true, message: '每个菜单 ID 必须是有效的 UUID' })
  menuIds: string[];

  @ApiProperty({
    description: '角色默认首页路由(不需要前导斜杠)',
    example: 'home',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '首页路由必须是字符串' })
  @MinLength(1, { message: '首页路由不能为空' })
  home?: string;
}
