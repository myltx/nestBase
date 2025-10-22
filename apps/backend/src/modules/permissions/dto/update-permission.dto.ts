// src/modules/permissions/dto/update-permission.dto.ts
/**
 * 更新权限 DTO
 */

import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
