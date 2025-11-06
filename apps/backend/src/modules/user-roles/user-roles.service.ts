// src/modules/user-roles/user-roles.service.ts
/**
 * 用户-角色关联服务
 * 提供用户角色的查询、设置和批量管理功能
 */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UserRolesService {
  private readonly logger = new Logger(UserRolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * 获取用户的角色列表
   * @param userId 用户ID
   * @returns 角色列表
   */
  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user.userRoles.map((ur) => ur.role);
  }

  /**
   * 设置用户的角色（完全替换）
   * @param userId 用户ID
   * @param roleIds 角色ID列表
   * @param actorId 操作者ID
   */
  async setUserRoles(userId: string, roleIds: string[], actorId?: string) {
    // 验证用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证所有角色是否存在
    if (roleIds.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } },
      });

      if (roles.length !== roleIds.length) {
        const foundIds = roles.map((r) => r.id);
        const missingIds = roleIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(`以下角色不存在: ${missingIds.join(', ')}`);
      }
    }

    // 获取变更前的角色
    const beforeRoles = await this.getUserRoles(userId);

    try {
      // 使用事务：先删除旧关系，再创建新关系
      await this.prisma.$transaction(async (tx) => {
        // 删除用户的所有角色
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // 创建新的角色关联
        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({
              userId,
              roleId,
            })),
          });
        }
      });

      // 记录审计日志
      await this.audit.log({
        event: 'user.roles.set',
        userId: actorId,
        resource: 'User',
        resourceId: userId,
        action: 'UPDATE',
        payload: {
          actorId,
          userId,
          before: beforeRoles.map((r) => r.id),
          after: roleIds,
        },
      });

      return {
        userId,
        roleIds,
        message: '用户角色设置成功',
      };
    } catch (error) {
      this.logger.error(`设置用户角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('设置用户角色失败');
    }
  }

  /**
   * 查询角色下的用户列表（分页）
   * @param roleId 角色ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param search 搜索关键字
   */
  async getUsersByRole(roleId: string, page = 1, pageSize = 20, search?: string) {
    // 验证角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 参数校验
    const safePage = Math.max(1, page);
    const safeSize = Math.min(Math.max(1, pageSize), 100);
    const skip = (safePage - 1) * safeSize;

    // 构建查询条件
    const searchCondition = search
      ? {
          OR: [
            { userName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    try {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where: {
            ...searchCondition,
            userRoles: {
              some: { roleId },
            },
          },
          select: {
            id: true,
            email: true,
            userName: true,
            nickName: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
          skip,
          take: safeSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({
          where: {
            ...searchCondition,
            userRoles: {
              some: { roleId },
            },
          },
        }),
      ]);

      return {
        items: users,
        total,
        page: safePage,
        pageSize: safeSize,
        totalPages: Math.ceil(total / safeSize),
      };
    } catch (error) {
      this.logger.error(`查询角色用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('查询角色用户失败');
    }
  }

  /**
   * 批量将用户添加到角色
   * @param roleId 角色ID
   * @param userIds 用户ID列表
   * @param actorId 操作者ID
   */
  async addUsersToRole(roleId: string, userIds: string[], actorId?: string) {
    // 参数校验
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('用户列表不能为空');
    }

    if (userIds.length > 100) {
      throw new BadRequestException('最多支持 100 个用户的批量操作');
    }

    // 验证角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 验证用户是否存在
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map((u) => u.id);
      const missingIds = userIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`以下用户不存在: ${missingIds.join(', ')}`);
    }

    try {
      // 使用 createMany 批量插入，跳过已存在的记录
      const result = await this.prisma.userRole.createMany({
        data: userIds.map((userId) => ({
          userId,
          roleId,
        })),
        skipDuplicates: true, // 跳过已存在的用户-角色关联
      });

      // 记录审计日志
      await this.audit.log({
        event: 'role.users.add',
        userId: actorId,
        resource: 'Role',
        resourceId: roleId,
        action: 'UPDATE',
        payload: {
          actorId,
          roleId,
          userIds,
          added: result.count,
        },
      });

      return {
        roleId,
        added: result.count,
        message: `成功添加 ${result.count} 个用户到角色`,
      };
    } catch (error) {
      this.logger.error(`批量添加用户到角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('批量添加用户到角色失败');
    }
  }

  /**
   * 批量将用户从角色移除
   * @param roleId 角色ID
   * @param userIds 用户ID列表
   * @param actorId 操作者ID
   */
  async removeUsersFromRole(roleId: string, userIds: string[], actorId?: string) {
    // 参数校验
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('用户列表不能为空');
    }

    if (userIds.length > 100) {
      throw new BadRequestException('最多支持 100 个用户的批量操作');
    }

    // 验证角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    try {
      // 批量删除用户-角色关联
      const result = await this.prisma.userRole.deleteMany({
        where: {
          roleId,
          userId: { in: userIds },
        },
      });

      // 记录审计日志
      await this.audit.log({
        event: 'role.users.remove',
        userId: actorId,
        resource: 'Role',
        resourceId: roleId,
        action: 'UPDATE',
        payload: {
          actorId,
          roleId,
          userIds,
          removed: result.count,
        },
      });

      return {
        roleId,
        removed: result.count,
        message: `成功移除 ${result.count} 个用户的角色`,
      };
    } catch (error) {
      this.logger.error(`批量移除角色用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('批量移除角色用户失败');
    }
  }
}
