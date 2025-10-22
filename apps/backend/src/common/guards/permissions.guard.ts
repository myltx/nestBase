// src/common/guards/permissions.guard.ts
/**
 * 权限守卫
 * 验证用户是否拥有所需的权限
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@modules/prisma/prisma.service';

export const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): boolean {
    // 获取路由所需权限
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.id) {
      throw new ForbiddenException('未登录或用户信息不完整');
    }

    // 查询用户的角色 ID
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
      },
      select: {
        roleId: true,
      },
    });

    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      throw new ForbiddenException('用户未分配任何角色');
    }

    // 查询角色拥有的权限代码
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      include: {
        permission: {
          select: {
            code: true,
            status: true,
          },
        },
      },
    });

    const userPermissionCodes = rolePermissions
      .filter((rp) => rp.permission.status === 1) // 只统计启用的权限
      .map((rp) => rp.permission.code);

    // 检查是否拥有所有所需权限
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissionCodes.includes(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !userPermissionCodes.includes(permission),
      );

      throw new ForbiddenException(
        `权限不足,缺少以下权限: ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
