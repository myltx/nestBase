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
import { RedisService } from '@modules/redis/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MenusService {
  private readonly routesCacheTtl: number;

  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.routesCacheTtl = Number(this.configService.get('MENU_ROUTES_CACHE_TTL', 300));
  }

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
  /**
   * 查询所有菜单（支持分页和树形结构）
   */
  async findAll(queryDto: QueryMenuDto) {
    const {
      search,
      rootOnly,
      activeOnly,
      parentId,
      current,
      size,
      format,
    } = queryDto;

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

    // 如果请求树形结构，或者没有分页参数且不是 rootOnly，则返回全量数据的树形或列表
    if (format === 'tree' || (!current && !size && !rootOnly)) {
      const allMenus = await this.prisma.menu.findMany({
        where,
        select: this.menuSelect,
        orderBy: { order: 'asc' },
      });

      if (format === 'tree' || (!current && !size)) {
         // 在内存中构建树形结构（递归函数）
        const buildTree = (pid: string | null = null): any[] => {
          const children = allMenus.filter((menu) => menu.parentId === pid);
          return children.map((menu) => ({
            ...menu,
            children: buildTree(menu.id).length > 0 ? buildTree(menu.id) : undefined,
          }));
        };
        // 如果指定了 parentId，则从该 parentId 开始构建；否则从根节点开始
        return buildTree(parentId || null);
      }

      // 如果只是列表且没分页 (理论上如果不传 current/size 且不是 tree，上面逻辑会走 tree，这里做个 fallback 或明确 list 逻辑)
      // 但实际上如果有 format='list' 且无分页，应该返回全量列表
      return allMenus;
    }


    // 以下是分页逻辑（通常用于 list 模式）
    const pageNum = parseInt(current || '1', 10);
    const limitNum = parseInt(size || '10', 10);

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException({
        message: '页码和每页数量必须大于 0',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // 针对只查询顶层菜单的分页（rootOnly=true）
    // 或者普通的列表分页
    
    // 查询菜单及总数
    const [menus, total] = await Promise.all([
      this.prisma.menu.findMany({
        where,
        skip,
        take: limitNum,
        select: this.menuSelect,
        orderBy: { order: 'asc' },
      }),
      this.prisma.menu.count({ where }),
    ]);

    return {
      records: menus,
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }



  /**
   * 转换菜单数据为前端路由格式
   */
  private transformMenuToRoute(menu: any): any {
    const route: any = {
      path: menu.routePath || '',
      name: menu.routeName,
      component: menu.component,
      meta: {
        title: menu.menuName,
        ...(menu.i18nKey && { i18nKey: menu.i18nKey }),
        ...(menu.href && { href: menu.href }),
        hideInMenu: menu.hideInMenu ?? false,
        keepAlive: menu.keepAlive ?? true,
        order: menu.order ?? 0,
        constant: menu.constant ?? false,
        ...(menu.activeMenu && { activeMenu: menu.activeMenu }),
        ...(menu.multiTab !== undefined && { multiTab: menu.multiTab }),
        ...(menu.icon && { icon: menu.icon }),
        ...(menu.iconType !== undefined && { iconType: menu.iconType }),
        ...(menu.localIcon && { localIcon: menu.localIcon }),
        ...(menu.fixedIndexInTab !== undefined && { fixedIndexInTab: menu.fixedIndexInTab }),
      },
      children: menu.children ? menu.children.map((child: any) => this.transformMenuToRoute(child)) : [],
    };

    // 如果 href 为 null 则不包含该字段
    if (!route.meta.href) {
      delete route.meta.href;
    }

    return route;
  }

  /**
   * 获取常量菜单（无需登录和权限验证的菜单）
   * 返回树形结构，过滤掉隐藏菜单
   */
  async findConstantMenus() {
    // 查询所有常量菜单（启用状态）
    const menus = await this.prisma.menu.findMany({
      where: {
        constant: true,
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

    const tree = buildTree();

    // 转换为前端路由格式
    return tree.map((menu) => this.transformMenuToRoute(menu));
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
   * 返回格式：{ routes: [], home: string }
   */
  async findByRoles(roleCodes: string[]) {
    const normalizedRoleCodes = Array.from(new Set(roleCodes?.filter(Boolean) ?? []));
    const cacheKey =
      normalizedRoleCodes.length > 0
        ? `menu:routes:${normalizedRoleCodes.join('|')}`
        : 'menu:routes:guest';
    const cached = await this.redisService.getJson<{ routes: any[]; home: string }>(cacheKey);

    if (cached) {
      return cached;
    }

    // 先通过角色 code 查询角色 ID 和 home 字段
    const roles = await this.prisma.role.findMany({
      where: {
        code: {
          in: roleCodes,
        },
      },
      select: {
        id: true,
        home: true,
      },
    });

    const roleIds = roles.map((role) => role.id);

    if (roleIds.length === 0) {
      const result = {
        routes: [],
        home: '/home', // 默认首页
      };
      await this.redisService.setJson(cacheKey, result, this.routesCacheTtl);
      return result;
    }

    // 查询角色拥有的菜单 ID
    const roleMenus = await this.prisma.roleMenu.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      select: {
        menuId: true,
      },
    });

    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];

    if (menuIds.length === 0) {
      const result = {
        routes: [],
        home: roles[0]?.home || '/home', // 使用第一个角色的 home 或默认值
      };
      await this.redisService.setJson(cacheKey, result, this.routesCacheTtl);
      return result;
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

    const tree = buildTree();

    // 转换为前端路由格式
    const routes = tree.map((menu) => this.transformMenuToRoute(menu));

    // 返回路由和首页
    // 如果用户有多个角色，使用第一个角色的 home 字段
    const result = {
      routes,
      home: roles[0]?.home || '/home',
    };

    await this.redisService.setJson(cacheKey, result, this.routesCacheTtl);

    return result;
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

    // 注意：parentId 创建后不能修改，即使传入也会被忽略

    // 验证：目录类型（menuType=1）不能有父菜单
    const finalMenuType = menuType !== undefined ? menuType : existingMenu.menuType;
    const finalParentId = existingMenu.parentId; // 始终使用现有的 parentId，不允许修改

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

    // 更新菜单（parentId 不可修改）
    const menu = await this.prisma.menu.update({
      where: { id },
      data: {
        ...(routeName && { routeName }),
        // parentId 不可修改，即使传入也会被忽略
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

  /**
   * 获取所有菜单的路由名称列表
   */
  async getAllRouteNames() {
    const menus = await this.prisma.menu.findMany({
      select: {
        routeName: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return menus.map((menu) => menu.routeName);
  }

  /**
   * 检查路由名称是否存在
   * @param routeName 路由名称
   * @returns { exists: boolean, menu?: object } 是否存在以及菜单信息
   */
  async isRouteExist(routeName: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { routeName },
      select: {
        id: true,
        routeName: true,
        menuName: true,
        routePath: true,
        status: true,
      },
    });

    if (!menu) {
      return {
        exists: false,
        routeName,
      };
    }

    return {
      exists: true,
      routeName,
      menu: {
        id: menu.id,
        routeName: menu.routeName,
        menuName: menu.menuName,
        routePath: menu.routePath,
        status: menu.status,
      },
    };
  }
}
