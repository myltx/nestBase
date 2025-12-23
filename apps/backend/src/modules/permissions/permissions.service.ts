// src/modules/permissions/permissions.service.ts
/**
 * 权限服务
 * 处理权限相关的业务逻辑
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 权限字段选择器
   */
  private readonly permissionSelect = {
    id: true,
    code: true,
    name: true,
    type: true,
    menuId: true,
    description: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  /**
   * 创建权限
   */
  async create(createPermissionDto: CreatePermissionDto) {
    const { code, name, type, menuId, ...rest } = createPermissionDto;

    // 检查权限代码是否已存在
    const existingByCode = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (existingByCode) {
      throw new ConflictException({
        message: `权限代码 ${code} 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 如果是按钮权限或 API 权限，必须指定菜单 ID
    if ((type === 'BUTTON' || type === 'API') && !menuId) {
      throw new BadRequestException({
        message: `${type === 'BUTTON' ? '按钮' : '接口'}权限必须指定所属菜单`,
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    // 如果指定了菜单 ID，检查菜单是否存在
    if (menuId) {
      const menu = await this.prisma.menu.findUnique({
        where: { id: menuId },
      });

      if (!menu) {
        throw new NotFoundException({
          message: `菜单 ID ${menuId} 不存在`,
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 创建权限
    const permission = await this.prisma.permission.create({
      data: {
        code,
        name,
        type,
        menuId,
        ...rest,
      },
      select: this.permissionSelect,
    });

    return permission;
  }

  /**
   * 查询所有权限（支持分页和筛选）
   */
  async findAll(queryDto: QueryPermissionDto) {
    const {
      search,
      type,
      menuId,
      activeOnly,
      current,
      size,
    } = queryDto;

    // 构建查询条件
    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (menuId !== undefined) {
      where.menuId = menuId;
    }

    if (activeOnly) {
      where.status = 1;
    }

    // 如果未请求分页，返回所有符合条件的结果
    if (!current && !size) {
      return this.prisma.permission.findMany({
        where,
        select: {
          ...this.permissionSelect,
          menu: {
            select: {
              id: true,
              routeName: true,
              menuName: true,
            },
          },
        },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
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

    // 查询权限及总数
    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          ...this.permissionSelect,
          menu: {
            select: {
              id: true,
              routeName: true,
              menuName: true,
            },
          },
        },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      records: permissions,
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * 根据 ID 查询权限
   */
  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: this.permissionSelect,
    });

    if (!permission) {
      throw new NotFoundException({
        message: `权限 ID ${id} 不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    return permission;
  }

  /**
   * 根据角色代码查询权限
   */
  async findByRoles(roleCodes: string[]) {
    // 查询角色拥有的权限 ID
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: {
          in: roleCodes,
        },
      },
      select: {
        permissionId: true,
      },
    });

    const permissionIds = [...new Set(rolePermissions.map((rp) => rp.permissionId))];

    if (permissionIds.length === 0) {
      return [];
    }

    // 查询权限详情
    const permissions = await this.prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
        status: 1,
      },
      select: this.permissionSelect,
    });

    return permissions;
  }



  /**
   * 更新权限
   */
  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    // 检查权限是否存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      throw new NotFoundException({
        message: `权限 ID ${id} 不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    const { code, name, ...rest } = updatePermissionDto;

    // 如果更新权限代码，检查是否与其他权限冲突
    if (code && code !== existingPermission.code) {
      const conflictByCode = await this.prisma.permission.findUnique({
        where: { code },
      });

      if (conflictByCode) {
        throw new ConflictException({
          message: `权限代码 ${code} 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 如果更新权限名称，检查是否与其他权限冲突（移除名称唯一性检查）
    // 权限名称不再要求唯一

    // 更新权限
    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...rest,
      },
      select: this.permissionSelect,
    });

    return permission;
  }

  /**
   * 删除权限
   */
  async remove(id: string) {
    // 检查权限是否存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!existingPermission) {
      throw new NotFoundException({
        message: `权限 ID ${id} 不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    // 删除权限（会级联删除角色权限关联）
    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: '权限删除成功' };
  }
}
