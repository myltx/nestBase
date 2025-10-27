// src/modules/menus/menus.service.ts
/**
 * 菜单服务
 * 处理菜单相关的业务逻辑
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto, UpdateMenuDto, QueryMenuDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  /**
   * 菜单字段选择器
   */
  private readonly menuSelect = {
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
    keepAlive: true,
    constant: true,
    query: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  };

  /**
   * 创建菜单
   */
  async create(createMenuDto: CreateMenuDto) {
    const { routeName, parentId, menuType, ...rest } = createMenuDto;

    // 验证：目录类型（menuType=1）不能有父菜单
    if (menuType === 1 && parentId) {
      throw new BadRequestException({
        message: '目录类型菜单不能设置父菜单',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    // 检查路由标识是否已存在
    const existingMenu = await this.prisma.menu.findUnique({
      where: { routeName },
    });

    if (existingMenu) {
      throw new ConflictException({
        message: `路由标识 ${routeName} 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 如果指定了父菜单，检查父菜单是否存在
    if (parentId) {
      const parentMenu = await this.prisma.menu.findUnique({
        where: { id: parentId },
      });

      if (!parentMenu) {
        throw new NotFoundException({
          message: `父菜单 ID ${parentId} 不存在`,
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 创建菜单
    const menu = await this.prisma.menu.create({
      data: {
        routeName,
        parentId,
        menuType,
        ...rest,
      },
      select: this.menuSelect,
    });

    return menu;
  }

  /**
   * 查询所有菜单（支持分页和树形结构）
   */
  async findAll(queryDto: QueryMenuDto) {
    const { search, rootOnly, activeOnly, parentId, current = '1', size = '10' } = queryDto;

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

    if (search) {
      where.OR = [
        { menuName: { contains: search, mode: 'insensitive' } },
        { routeName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (rootOnly) {
      where.parentId = null;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (activeOnly) {
      where.status = 1;
    }

    // 只查询顶层菜单（没有父菜单的）
    const topLevelWhere = {
      ...where,
      parentId: null,
    };

    // 查询顶层菜单及总数
    const [topLevelMenus, total] = await Promise.all([
      this.prisma.menu.findMany({
        where: topLevelWhere,
        skip,
        take: limitNum,
        select: this.menuSelect,
        orderBy: { order: 'asc' },
      }),
      this.prisma.menu.count({ where: topLevelWhere }),
    ]);

    // 递归加载每个顶层菜单的子菜单
    const buildChildren = async (parentId: string): Promise<any[]> => {
      const children = await this.prisma.menu.findMany({
        where: {
          parentId,
          ...(activeOnly ? { status: 1 } : {}),
        },
        select: this.menuSelect,
        orderBy: { order: 'asc' },
      });

      const result = [];
      for (const child of children) {
        const subChildren = await buildChildren(child.id);
        result.push({
          ...child,
          children: subChildren.length > 0 ? subChildren : [],
        });
      }

      return result;
    };

    // 为每个顶层菜单添加子菜单
    const menusWithChildren = await Promise.all(
      topLevelMenus.map(async (menu) => {
        const children = await buildChildren(menu.id);
        return {
          ...menu,
          children,
        };
      }),
    );

    return {
      records: menusWithChildren,
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * 获取树形菜单结构
   */
  async findTree(activeOnly: boolean = false) {
    const where: any = {
      parentId: null,
    };

    if (activeOnly) {
      where.status = 1;
    }

    const buildTree = async (parentId: string | null = null): Promise<any[]> => {
      const menus = await this.prisma.menu.findMany({
        where: {
          parentId,
          ...(activeOnly ? { status: 1 } : {}),
        },
        select: this.menuSelect,
        orderBy: { order: 'asc' },
      });

      const result = [];
      for (const menu of menus) {
        const children = await buildTree(menu.id);
        result.push({
          ...menu,
          children: children.length > 0 ? children : undefined,
        });
      }

      return result;
    };

    return buildTree();
  }

  /**
   * 根据 ID 查询菜单
   */
  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      select: {
        ...this.menuSelect,
        parent: {
          select: this.menuSelect,
        },
        children: {
          select: this.menuSelect,
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException({
        message: `菜单 ID ${id} 不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    return menu;
  }

  /**
   * 根据角色查询菜单（前端路由使用）
   */
  async findByRoles(roleCodes: string[]) {
    // 查询角色拥有的菜单 ID
    const roleMenus = await this.prisma.roleMenu.findMany({
      where: {
        roleId: {
          in: roleCodes,
        },
      },
      select: {
        menuId: true,
      },
    });

    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];

    if (menuIds.length === 0) {
      return [];
    }

    // 查询菜单详情
    const menus = await this.prisma.menu.findMany({
      where: {
        id: {
          in: menuIds,
        },
        status: 1,
      },
      select: this.menuSelect,
      orderBy: { order: 'asc' },
    });

    // 构建树形结构
    const buildTree = (parentId: string | null = null): any[] => {
      return menus
        .filter((menu) => menu.parentId === parentId)
        .map((menu) => ({
          ...menu,
          children: buildTree(menu.id),
        }))
        .filter((menu) => {
          // 如果有子菜单，保留；如果没有子菜单且自身不隐藏，保留
          if (menu.children && menu.children.length > 0) return true;
          return !menu.hideInMenu;
        });
    };

    return buildTree();
  }

  /**
   * 更新菜单
   */
  async update(id: string, updateMenuDto: UpdateMenuDto) {
    // 检查菜单是否存在
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      throw new NotFoundException({
        message: `菜单 ID ${id} 不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    const { routeName, parentId, menuType, ...rest } = updateMenuDto;

    // 验证：目录类型（menuType=1）不能有父菜单
    const finalMenuType = menuType !== undefined ? menuType : existingMenu.menuType;
    const finalParentId = parentId !== undefined ? parentId : existingMenu.parentId;

    if (finalMenuType === 1 && finalParentId) {
      throw new BadRequestException({
        message: '目录类型菜单不能设置父菜单',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    // 如果更新路由标识，检查是否与其他菜单冲突
    if (routeName && routeName !== existingMenu.routeName) {
      const conflictMenu = await this.prisma.menu.findUnique({
        where: { routeName },
      });

      if (conflictMenu) {
        throw new ConflictException({
          message: `路由标识 ${routeName} 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 如果更新父菜单，检查是否存在且不能设置为自己
    if (parentId !== undefined) {
      if (parentId === id) {
        throw new BadRequestException({
          message: '不能将菜单设置为自己的子菜单',
          code: BusinessCode.VALIDATION_ERROR,
        });
      }

      if (parentId) {
        const parentMenu = await this.prisma.menu.findUnique({
          where: { id: parentId },
        });

        if (!parentMenu) {
          throw new NotFoundException({
            message: `父菜单 ID ${parentId} 不存在`,
            code: BusinessCode.NOT_FOUND,
          });
        }
      }
    }

    // 更新菜单
    const menu = await this.prisma.menu.update({
      where: { id },
      data: {
        ...(routeName && { routeName }),
        ...(parentId !== undefined && { parentId }),
        ...(menuType !== undefined && { menuType }),
        ...rest,
      },
      select: this.menuSelect,
    });

    return menu;
  }

  /**
   * 删除菜单
   */
  async remove(id: string) {
    // 检查菜单是否存在
    const existingMenu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!existingMenu) {
      throw new NotFoundException({
        message: `菜单 ID ${id} 不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    // 检查是否有子菜单
    if (existingMenu.children.length > 0) {
      throw new BadRequestException({
        message: '该菜单下有子菜单，无法删除',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    // 删除菜单（会级联删除角色菜单关联）
    await this.prisma.menu.delete({
      where: { id },
    });

    return { message: '菜单删除成功' };
  }
}
