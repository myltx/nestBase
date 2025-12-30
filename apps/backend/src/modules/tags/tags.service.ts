// src/modules/tags/tags.service.ts
/**
 * 标签服务
 * 处理标签的 CRUD 和业务逻辑
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto, UpdateTagDto, QueryTagDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建标签
   */
  async create(createTagDto: CreateTagDto) {
    const { name, slug } = createTagDto;

    // 检查名称是否已存在
    const existingByName = await this.prisma.tag.findUnique({
      where: { name },
    });

    if (existingByName) {
      throw new ConflictException({
        message: `标签名称 "${name}" 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 检查 slug 是否已存在
    const existingBySlug = await this.prisma.tag.findUnique({
      where: { slug },
    });

    if (existingBySlug) {
      throw new ConflictException({
        message: `URL标识符 "${slug}" 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 创建标签
    const tag = await this.prisma.tag.create({
      data: createTagDto,
      include: {
        _count: {
          select: {
            contents: true,
          },
        },
      },
    });

    return tag;
  }

  /**
   * 查询所有标签
   */
  /**
   * 查询标签列表（支持分页、搜索、排序）
   */
  async findAll(queryDto?: QueryTagDto) {
    const { search, name, sort, current, size } = queryDto || {};

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    const orderBy: any = {};
    if (sort === 'popular') {
      orderBy.contents = { _count: 'desc' };
    } else {
      orderBy.createdAt = 'desc';
    }

    // Include logic strictly matches previous behavior: count of contents.
    const include = {
      _count: { select: { contents: true } },
    };

    // If current/size are provided, use pagination
    if (current && size) {
      const pageNum = parseInt(current, 10);
      const limitNum = parseInt(size, 10);

      if (pageNum < 1 || limitNum < 1) {
        throw new BadRequestException({
          message: '页码和每页数量必须大于 0',
          code: BusinessCode.VALIDATION_ERROR,
        });
      }

      const skip = (pageNum - 1) * limitNum;
      const [data, total] = await Promise.all([
        this.prisma.tag.findMany({ where, orderBy, skip, take: limitNum, include }),
        this.prisma.tag.count({ where }),
      ]);

      return {
        records: data,
        current: pageNum,
        size: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      };
    }

    // Default: find all (no paging)
    return this.prisma.tag.findMany({ where, orderBy, include });
  }

  /**
   * 根据 ID 查询标签
   */
  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contents: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException({
        message: '标签不存在',
        code: BusinessCode.NOT_FOUND,
      });
    }

    return tag;
  }

  /**
   * 根据 slug 查询标签
   */
  async findBySlug(slug: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            contents: true,
          },
        },
      },
    });

    if (!tag) {
      throw new NotFoundException({
        message: '标签不存在',
        code: BusinessCode.NOT_FOUND,
      });
    }

    return tag;
  }

  /**
   * 更新标签
   */
  async update(id: string, updateTagDto: UpdateTagDto) {
    // 检查标签是否存在
    await this.findOne(id);

    const { name, slug } = updateTagDto;

    // 如果修改了名称，检查是否重复
    if (name) {
      const existingByName = await this.prisma.tag.findUnique({
        where: { name },
      });

      if (existingByName && existingByName.id !== id) {
        throw new ConflictException({
          message: `标签名称 "${name}" 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 如果修改了 slug，检查是否重复
    if (slug) {
      const existingBySlug = await this.prisma.tag.findUnique({
        where: { slug },
      });

      if (existingBySlug && existingBySlug.id !== id) {
        throw new ConflictException({
          message: `URL标识符 "${slug}" 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 更新标签
    const tag = await this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
      include: {
        _count: {
          select: {
            contents: true,
          },
        },
      },
    });

    return tag;
  }

  /**
   * 删除标签
   */
  async remove(id: string) {
    // 检查标签是否存在
    await this.findOne(id);

    // 检查是否有内容关联
    const contentsCount = await this.prisma.contentTag.count({
      where: { tagId: id },
    });

    if (contentsCount > 0) {
      throw new BadRequestException({
        message: `该标签下有 ${contentsCount} 篇内容，无法删除`,
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    await this.prisma.tag.delete({
      where: { id },
    });

    return { message: '标签删除成功' };
  }

  /**
   * 批量创建标签（用于导入）
   */
  async createMany(tags: CreateTagDto[]) {
    const created: any[] = [];
    const errors: any[] = [];

    for (const tagDto of tags) {
      try {
        const tag = await this.create(tagDto);
        created.push(tag);
      } catch (error) {
        errors.push({
          tag: tagDto,
          error: error.message,
        });
      }
    }

    return {
      created: created.length,
      failed: errors.length,
      data: created,
      errors,
    };
  }
}
