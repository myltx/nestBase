// src/common/decorators/permissions.decorator.ts
/**
 * 权限装饰器
 * 用于标记路由所需的权限
 */

import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../guards/permissions.guard';

/**
 * 要求用户拥有指定权限才能访问
 * @param permissions 权限代码数组 (例如: 'user.create', 'user.update')
 *
 * @example
 * @RequirePermissions('user.create', 'user.update')
 * @Post()
 * createUser() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
