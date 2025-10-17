// src/modules/roles/dto/update-role.dto.ts
/**
 * 更新角色 DTO
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
