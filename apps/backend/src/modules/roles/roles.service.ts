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
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

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

}
