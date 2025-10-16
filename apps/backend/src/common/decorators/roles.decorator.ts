// src/common/decorators/roles.decorator.ts
/**
 * 角色装饰器
 * 用于标记需要特定角色才能访问的路由
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
