// src/modules/roles/roles.service.ts
/**
 * 角色服务
 * 处理角色相关的业务逻辑
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '@modules/redis/redis.service';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 规范化 home 路径：去掉开头的 /
   */
  private normalizeHomePath(home: string): string {
    return home.startsWith('/') ? home.slice(1) : home;
  }

  /**
   * 获取所有角色列表（支持分页和筛选）
   */
  async findAll(queryDto: QueryRoleDto) {
    const { search, isSystem, status, current, size } = queryDto;

    // 构建查询条件
    const where: any = {};

    // 搜索关键词（角色代码或名称）
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 是否为系统角色
    if (isSystem !== undefined) {
      where.isSystem = isSystem;
    }

    // 角色状态
    if (status !== undefined) {
      where.status = status;
    }

    // 如果未请求分页，返回所有符合条件的结果
    if (!current && !size) {
      return this.prisma.role.findMany({
        where,
        include: {
          _count: {
            select: {
              userRoles: true,
              roleMenus: true,
            },
          },
        },
        orderBy: [
          { isSystem: 'desc' }, // 系统角色优先
          { createdAt: 'asc' },
        ],
      });
    }

    // 处理分页
    const pageNum = parseInt(current || '1', 10);
    const limitNum = parseInt(size || '10', 10);

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException({
        message: '页码和每页数量必须大于 0',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // 查询角色列表和总数
    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: {
              userRoles: true,
              roleMenus: true,
            },
          },
        },
        orderBy: [
          { isSystem: 'desc' }, // 系统角色优先
          { createdAt: 'asc' },
        ],
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      records: roles,
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * 根据角色 ID 获取角色信息
   */
  async findOne(id: string, includeRelations = false) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true,
            roleMenus: true,
            rolePermissions: true, // Also include permission count if not already
          },
        },
        ...(includeRelations && {
          roleMenus: { select: { menuId: true } },
          rolePermissions: { select: { permissionId: true } },
        }),
      },
    });

    if (!role) {
      throw new NotFoundException({
        message: `角色不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    if (includeRelations) {
      const { roleMenus, rolePermissions, ...rest } = role;
      return {
        ...rest,
        menuIds: roleMenus.map((rm) => rm.menuId),
        permissionIds: rolePermissions.map((rp) => rp.permissionId),
      };
    }

    return role;
  }

  /**
   * 根据角色 code 获取角色信息
   */
  async findByCode(code: string) {
    const role = await this.prisma.role.findUnique({
      where: { code },
    });

    if (!role) {
      throw new NotFoundException({
        message: `角色 ${code} 不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    return role;
  }

  /**
   * 创建新角色
   */
  async create(createDto: CreateRoleDto) {
    const { code, name, home, menuIds, permissionIds, ...rest } = createDto;

    // 不允许通过 API 创建系统角色
    if ((rest as any).isSystem === true) {
      throw new BadRequestException({
        message: '不允许通过 API 创建系统角色',
        code: BusinessCode.FORBIDDEN,
      });
    }

    // 检查角色代码是否已存在
    const existingByCode = await this.prisma.role.findUnique({
      where: { code },
    });

    if (existingByCode) {
      throw new ConflictException({
        message: `角色代码 ${code} 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 检查角色名称是否已存在
    const existingByName = await this.prisma.role.findUnique({
      where: { name },
    });

    if (existingByName) {
      throw new ConflictException({
        message: `角色名称 ${name} 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 确保 isSystem 字段不被设置
    return this.prisma.role.create({
      data: {
        code,
        name,
        ...(home && { home: this.normalizeHomePath(home) }), // 如果提供了 home 字段则使用,否则使用数据库默认值 home
        ...rest,
        isSystem: false, // 强制设置为 false
        roleMenus: menuIds?.length
          ? {
              create: menuIds.map((menuId) => ({ menuId })),
            }
          : undefined,
        rolePermissions: permissionIds?.length
          ? {
              create: permissionIds.map((permissionId) => ({ permissionId })),
            }
          : undefined,
      },
    });
  }

  /**
   * 更新角色
   */
  async update(id: string, updateDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    // 系统角色不允许修改任何字段
    if (role.isSystem) {
      throw new BadRequestException({
        message: '系统角色不允许修改',
        code: BusinessCode.FORBIDDEN,
      });
    }

    // 从 DTO 中提取 code 字段,但不会用于更新
    // code 字段在创建后不可修改(即使传入也会被忽略)
    const { code, menuIds, permissionIds, ...rest } = updateDto;

    // 所有角色都不允许修改 code 字段(即使传入也会被忽略)
    // isSystem 字段也不允许通过 API 修改(即使传入也会被忽略)

    // 检查 name 是否重复
    if (rest.name && rest.name !== role.name) {
      const existingByName = await this.prisma.role.findUnique({
        where: { name: rest.name },
      });

      if (existingByName) {
        throw new ConflictException({
          message: `角色名称 ${rest.name} 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 如果更新了 home 字段，需要标准化路径
    const updateData: any = { ...rest };
    if (updateData.home) {
      updateData.home = this.normalizeHomePath(updateData.home);
    }

    // 更新关联关系
    if (menuIds !== undefined) {
      updateData.roleMenus = {
        deleteMany: {},
        create: menuIds.map((menuId) => ({ menuId })),
      };
    }

    if (permissionIds !== undefined) {
      updateData.rolePermissions = {
        deleteMany: {},
        create: permissionIds.map((permissionId) => ({ permissionId })),
      };
    }

    return this.prisma.role.update({
      where: { id },
      data: updateData, // code 不包含在更新数据中
    });
  }

  /**
   * 删除角色
   */
  async remove(id: string) {
    const role = await this.findOne(id);

    // 不允许删除系统角色
    if (role.isSystem) {
      throw new BadRequestException({
        message: '不能删除系统角色',
        code: BusinessCode.FORBIDDEN,
      });
    }

    // 检查是否有用户关联此角色
    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException({
        message: `该角色下还有 ${userCount} 个用户,无法删除`,
        code: BusinessCode.FORBIDDEN,
      });
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return {
      message: '角色删除成功',
    };
  }

  /**
   * 批量删除角色
   */
  async batchRemove(ids: string[], actorId?: string) {
    if (ids.length === 0) {
      return { message: '删除成功(未选择任何角色)' };
    }

    // 检查是否包含系统角色
    const systemRoles = await this.prisma.role.findMany({
      where: {
        id: { in: ids },
        isSystem: true,
      },
      select: { code: true },
    });

    if (systemRoles.length > 0) {
      throw new BadRequestException(
        `包含系统角色无法删除: ${systemRoles.map((r) => r.code).join(', ')}`,
      );
    }

    // 检查是否有关联用户
    // 这里使用 aggregation 快速检查
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        roleId: { in: ids },
      },
      select: { roleId: true },
    });

    if (userRole) {
      // 如果需要更详细的错误信息，可以进一步查询哪一个角色有关联用户
      // 简单起见，拒绝操作
      throw new BadRequestException('部分角色下仍有用户关联，无法删除');
    }

    const result = await this.prisma.role.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    if (result.count > 0) {
      await this.audit.log({
        event: 'role.batch_delete',
        userId: actorId,
        resource: 'Role',
        resourceId: JSON.stringify(ids),
        action: 'DELETE',
        payload: {
          ids,
          count: result.count,
        },
      });
    }

    return { message: `成功删除 ${result.count} 个角色` };
  }

  private async invalidatePermissionCache(userIds: string | string[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) {
      return;
    }
    const keys = ids.map((id) => `permissions:${id}`);
    await this.redisService.del(...keys);
  }

  /**
   * 查询角色下的用户列表（分页）
   */
  async getUsersByRole(roleId: string, page = 1, pageSize = 20, search?: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    const safePage = Math.max(1, page);
    const safeSize = Math.min(Math.max(1, pageSize), 100);
    const skip = (safePage - 1) * safeSize;

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
   */
  async addUsersToRole(roleId: string, userIds: string[], actorId?: string) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('用户列表不能为空');
    }

    if (userIds.length > 100) {
      throw new BadRequestException('最多支持 100 个用户的批量操作');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

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
      const result = await this.prisma.userRole.createMany({
        data: userIds.map((userId) => ({
          userId,
          roleId,
        })),
        skipDuplicates: true,
      });

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

      await this.invalidatePermissionCache(userIds);

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
   */
  async removeUsersFromRole(roleId: string, userIds: string[], actorId?: string) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('用户列表不能为空');
    }

    if (userIds.length > 100) {
      throw new BadRequestException('最多支持 100 个用户的批量操作');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    try {
      const result = await this.prisma.userRole.deleteMany({
        where: {
          roleId,
          userId: { in: userIds },
        },
      });

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

      await this.invalidatePermissionCache(userIds);

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
  /**
   * 更新角色下的用户列表（覆盖）
   */
  async updateRoleUsers(roleId: string, userIds: string[], actorId?: string) {
    if (!Array.isArray(userIds)) {
      throw new BadRequestException('用户列表必须是数组');
    }

    if (userIds.length > 500) {
      throw new BadRequestException('最多支持 500 个用户的批量操作');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    // 检查用户是否存在
    if (userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
      });

      if (users.length !== userIds.length) {
        const foundIds = users.map((u) => u.id);
        const missingIds = userIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(`以下用户不存在: ${missingIds.join(', ')}`);
      }
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 删除现有关联
        await tx.userRole.deleteMany({
          where: { roleId },
        });

        // 2. 创建新关联
        if (userIds.length > 0) {
          await tx.userRole.createMany({
            data: userIds.map((userId) => ({
              userId,
              roleId,
            })),
          });
        }

        return userIds.length;
      });

      await this.audit.log({
        event: 'role.users.update',
        userId: actorId,
        resource: 'Role',
        resourceId: roleId,
        action: 'UPDATE',
        payload: {
          actorId,
          roleId,
          userIds,
          count: result,
        },
      });

      // 失效相关缓存
      // 这里比较难精确失效，简化起见，可以失效该角色相关的所有权限缓存
      // 或者如果系统允许，可以不立刻失效，依赖 TTL
      // 为了安全，建议尽可能失效
      // 这里简单处理：失效新列表中的用户权限缓存
      await this.invalidatePermissionCache(userIds);

      return {
        roleId,
        count: result,
        message: `成功更新角色用户列表，当前共 ${result} 个用户`,
      };
    } catch (error) {
      this.logger.error(`更新角色用户列表失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('更新角色用户列表失败');
    }
  }
}
