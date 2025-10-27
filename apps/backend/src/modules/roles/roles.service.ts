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
import { AssignMenusDto, CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有角色列表
   */
  async findAll(includeInactive = false) {
    return this.prisma.role.findMany({
      where: includeInactive ? {} : { status: 1 },
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

  /**
   * 分页查询角色列表
   */
  async findPage(queryDto: QueryRoleDto) {
    const { search, isSystem, status, current = '1', size = '10' } = queryDto;

    const pageNum = parseInt(current, 10);
    const limitNum = parseInt(size, 10);

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException({
        message: '页码和每页数量必须大于 0',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    const skip = (pageNum - 1) * limitNum;

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
  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true,
            roleMenus: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException({
        message: `角色不存在`,
        code: BusinessCode.NOT_FOUND,
      });
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
    const { code, name } = createDto;

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

    return this.prisma.role.create({
      data: createDto,
    });
  }

  /**
   * 更新角色
   */
  async update(id: string, updateDto: UpdateRoleDto) {
    const role = await this.findOne(id);

    // 如果是系统角色,不允许修改 code 和 isSystem 字段
    if (role.isSystem) {
      if (updateDto.code && updateDto.code !== role.code) {
        throw new BadRequestException({
          message: '不能修改系统角色的代码',
          code: BusinessCode.FORBIDDEN,
        });
      }
      if (updateDto.isSystem === false) {
        throw new BadRequestException({
          message: '不能将系统角色改为非系统角色',
          code: BusinessCode.FORBIDDEN,
        });
      }
    }

    // 检查 code 是否重复
    if (updateDto.code && updateDto.code !== role.code) {
      const existingByCode = await this.prisma.role.findUnique({
        where: { code: updateDto.code },
      });

      if (existingByCode) {
        throw new ConflictException({
          message: `角色代码 ${updateDto.code} 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 检查 name 是否重复
    if (updateDto.name && updateDto.name !== role.name) {
      const existingByName = await this.prisma.role.findUnique({
        where: { name: updateDto.name },
      });

      if (existingByName) {
        throw new ConflictException({
          message: `角色名称 ${updateDto.name} 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: updateDto,
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
   * 为角色分配菜单
   */
  async assignMenus(roleId: string, assignDto: AssignMenusDto) {
    const { menuIds } = assignDto;

    // 验证角色是否存在
    await this.findOne(roleId);

    // 验证所有菜单 ID 是否存在
    const menus = await this.prisma.menu.findMany({
      where: {
        id: {
          in: menuIds,
        },
      },
      select: {
        id: true,
      },
    });

    if (menus.length !== menuIds.length) {
      throw new BadRequestException({
        message: '部分菜单 ID 不存在',
        code: BusinessCode.NOT_FOUND,
      });
    }

    // 删除该角色现有的所有菜单关联
    await this.prisma.roleMenu.deleteMany({
      where: { roleId },
    });

    // 创建新的菜单关联
    if (menuIds.length > 0) {
      await this.prisma.roleMenu.createMany({
        data: menuIds.map((menuId) => ({
          roleId,
          menuId,
        })),
      });
    }

    return {
      message: '角色菜单分配成功',
      menuCount: menuIds.length,
    };
  }

  /**
   * 获取角色的菜单列表
   */
  async getRoleMenus(roleId: string) {
    // 验证角色是否存在
    await this.findOne(roleId);

    const roleMenus = await this.prisma.roleMenu.findMany({
      where: { roleId },
      include: {
        menu: {
          select: {
            id: true,
            routeName: true,
            routePath: true,
            menuName: true,
            i18nKey: true,
            iconType: true,
            icon: true,
            localIcon: true,
            iconFontSize: true,
            order: true,
            parentId: true,
            menuType: true,
            component: true,
            href: true,
            hideInMenu: true,
            activeMenu: true,
            multiTab: true,
            fixedIndexInTab: true,
            status: true,
            keepAlive: true,
            constant: true,
            query: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        menu: {
          order: 'asc',
        },
      },
    });

    return roleMenus.map((rm) => rm.menu);
  }

  /**
   * 获取角色关联的用户数量
   */
  async getRoleUserCount(roleId: string) {
    // 验证角色是否存在
    await this.findOne(roleId);

    const count = await this.prisma.userRole.count({
      where: { roleId },
    });

    return { userCount: count };
  }

  /**
   * 获取角色关联的菜单数量
   */
  async getRoleMenuCount(roleId: string) {
    // 验证角色是否存在
    await this.findOne(roleId);

    const count = await this.prisma.roleMenu.count({
      where: { roleId },
    });

    return { menuCount: count };
  }

  /**
   * 获取角色的统计信息
   */
  async getRoleStats(roleId: string) {
    const role = await this.findOne(roleId);

    const [userCount, menuCount, permissionCount] = await Promise.all([
      this.prisma.userRole.count({
        where: { roleId },
      }),
      this.prisma.roleMenu.count({
        where: { roleId },
      }),
      this.prisma.rolePermission.count({
        where: { roleId },
      }),
    ]);

    return {
      ...role,
      userCount,
      menuCount,
      permissionCount,
    };
  }

  /**
   * 为角色分配权限
   */
  async assignPermissions(roleId: string, permissionIds: string[]) {
    // 验证角色是否存在
    await this.findOne(roleId);

    // 验证所有权限 ID 是否存在
    if (permissionIds.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: {
          id: {
            in: permissionIds,
          },
        },
        select: {
          id: true,
        },
      });

      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException({
          message: '部分权限 ID 不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 删除该角色现有的所有权限关联
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // 创建新的权限关联
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }

    return {
      message: '角色权限分配成功',
      permissionCount: permissionIds.length,
    };
  }

  /**
   * 获取角色的权限列表
   */
  async getRolePermissions(roleId: string) {
    // 验证角色是否存在
    await this.findOne(roleId);

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            menuId: true,
            description: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [
        {
          permission: {
            type: 'asc',
          },
        },
        {
          permission: {
            code: 'asc',
          },
        },
      ],
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * 获取角色关联的权限数量
   */
  async getRolePermissionCount(roleId: string) {
    // 验证角色是否存在
    await this.findOne(roleId);

    const count = await this.prisma.rolePermission.count({
      where: { roleId },
    });

    return { permissionCount: count };
  }
}
