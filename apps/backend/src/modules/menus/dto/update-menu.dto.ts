// src/modules/menus/dto/update-menu.dto.ts
/**
 * 更新菜单 DTO
 */

import { PartialType } from '@nestjs/swagger';
import { CreateMenuDto } from './create-menu.dto';

export class UpdateMenuDto extends PartialType(CreateMenuDto) {}
