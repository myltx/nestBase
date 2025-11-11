// src/modules/categories/categories.service.ts
/**
 * 分类服务
 * 处理分类的 CRUD 和业务逻辑
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建分类
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const { name, slug, parentId } = createCategoryDto;

    // 检查名称是否已存在
    const existingByName = await this.prisma.category.findUnique({
      where: { name },
    });

    if (existingByName) {
      throw new ConflictException({
        message: `分类名称 "${name}" 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 检查 slug 是否已存在
    const existingBySlug = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingBySlug) {
      throw new ConflictException({
        message: `URL标识符 "${slug}" 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 如果有父分类，验证父分类是否存在
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new BadRequestException({
          message: '父分类不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 创建分类
    const category = await this.prisma.category.create({
      data: createCategoryDto,
      include: {
        parent: true,
        _count: {
          select: {
            children: true,
            contents: true,
          },
        },
      },
    });

    return category;
  }

  /**
   * 查询所有分类（树形结构）
   */
  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { status: 1 },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            contents: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // 构建树形结构
    return this.buildTree(categories);
  }

  /**
   * 查询所有分类（扁平列表）
   */
  async findAllFlat() {
    return this.prisma.category.findMany({
      where: { status: 1 },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            children: true,
            contents: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * 根据 ID 查询分类
   */
  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            contents: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException({
        message: '分类不存在',
        code: BusinessCode.NOT_FOUND,
      });
    }

    return category;
  }

  /**
   * 根据 slug 查询分类
   */
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            contents: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException({
        message: '分类不存在',
        code: BusinessCode.NOT_FOUND,
      });
    }

    return category;
  }

  /**
   * 更新分类
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // 检查分类是否存在
    await this.findOne(id);

    const { name, slug, parentId } = updateCategoryDto;

    // 如果修改了名称，检查是否重复
    if (name) {
      const existingByName = await this.prisma.category.findUnique({
        where: { name },
      });

      if (existingByName && existingByName.id !== id) {
        throw new ConflictException({
          message: `分类名称 "${name}" 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 如果修改了 slug，检查是否重复
    if (slug) {
      const existingBySlug = await this.prisma.category.findUnique({
        where: { slug },
      });

      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException({
          message: `URL标识符 "${slug}" 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 如果修改了父分类，验证父分类是否存在
    if (parentId !== undefined) {
      if (parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          throw new BadRequestException({
            message: '父分类不存在',
            code: BusinessCode.NOT_FOUND,
          });
        }

        // 防止循环引用
        if (parentId === id) {
          throw new BadRequestException({
            message: '不能将分类设置为自己的子分类',
            code: BusinessCode.VALIDATION_ERROR,
          });
        }
      }
    }

    // 更新分类
    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            contents: true,
          },
        },
      },
    });

    return category;
  }

  /**
   * 删除分类
   */
  async remove(id: string) {
    // 检查分类是否存在
    const category = await this.findOne(id);

    // 检查是否有子分类
    const childrenCount = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new BadRequestException({
        message: `该分类下有 ${childrenCount} 个子分类，无法删除`,
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    // 检查是否有内容
    const contentsCount = await this.prisma.content.count({
      where: { categoryId: id },
    });

    if (contentsCount > 0) {
      throw new BadRequestException({
        message: `该分类下有 ${contentsCount} 篇内容，无法删除`,
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: '分类删除成功' };
  }

  /**
   * 构建树形结构
   */
  private buildTree(categories: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    // 创建映射
    categories.forEach((category) => {
      map.set(category.id, { ...category, children: [] });
    });

    // 构建树
    categories.forEach((category) => {
      const node = map.get(category.id);
      if (category.parentId) {
        const parent = map.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
