// src/modules/contents/contents.service.ts
/**
 * 内容服务
 * 处理内容的 CRUD 和业务逻辑
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto, QueryContentDto, PublishContentDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';
import { ContentStatus, EditorType } from '@prisma/client';

@Injectable()
export class ContentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建内容
   */
  async create(createContentDto: CreateContentDto, authorId: string) {
    const { tagIds, ...contentData } = createContentDto;

    // 检查 slug 是否已存在
    const existingContent = await this.prisma.content.findUnique({
      where: { slug: contentData.slug },
    });

    if (existingContent) {
      throw new ConflictException({
        message: `URL标识符 "${contentData.slug}" 已存在`,
        code: BusinessCode.CONFLICT,
      });
    }

    // 验证编辑器类型和内容字段
    this.validateContentByEditorType(contentData.editorType || EditorType.MARKDOWN, contentData);

    // 如果提供了分类ID，验证分类是否存在
    if (contentData.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: contentData.categoryId },
      });

      if (!category) {
        throw new BadRequestException({
          message: '分类不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 如果提供了标签ID，验证标签是否存在
    if (tagIds && tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds } },
      });

      if (tags.length !== tagIds.length) {
        throw new BadRequestException({
          message: '部分标签不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 创建内容
    const content = await this.prisma.content.create({
      data: {
        ...contentData,
        authorId,
        editorType: contentData.editorType || EditorType.MARKDOWN,
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((tagId) => ({ tagId })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatContent(content);
  }

  /**
   * 查询所有内容（支持分页和搜索）
   */
  async findAll(queryDto: QueryContentDto) {
    const {
      search,
      status,
      editorType,
      categoryId,
      tagId,
      authorId,
      isTop,
      isRecommend,
      current = '1',
      size = '10',
    } = queryDto;

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

    // 搜索关键词（标题、摘要）
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 编辑器类型筛选
    if (editorType) {
      where.editorType = editorType;
    }

    // 分类筛选
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 标签筛选
    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      };
    }

    // 作者筛选
    if (authorId) {
      where.authorId = authorId;
    }

    // 置顶筛选
    if (isTop !== undefined) {
      where.isTop = isTop === 'true';
    }

    // 推荐筛选
    if (isRecommend !== undefined) {
      where.isRecommend = isRecommend === 'true';
    }

    // 查询内容
    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          author: {
            select: {
              id: true,
              userName: true,
              nickName: true,
              avatar: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: [
          { isTop: 'desc' }, // 置顶优先
          { publishedAt: 'desc' }, // 发布时间倒序
          { createdAt: 'desc' }, // 创建时间倒序
        ],
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      records: contents.map((content) => this.formatContent(content)),
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * 根据 ID 查询内容
   */
  async findOne(id: string, incrementView = false) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException({
        message: `内容不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    // 增加浏览量
    if (incrementView) {
      await this.prisma.content.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
      content.viewCount += 1;
    }

    return this.formatContent(content);
  }

  /**
   * 根据 slug 查询内容
   */
  async findBySlug(slug: string, incrementView = false) {
    const content = await this.prisma.content.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException({
        message: `内容不存在`,
        code: BusinessCode.NOT_FOUND,
      });
    }

    // 增加浏览量
    if (incrementView) {
      await this.prisma.content.update({
        where: { slug },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
      content.viewCount += 1;
    }

    return this.formatContent(content);
  }

  /**
   * 更新内容
   */
  async update(id: string, updateContentDto: UpdateContentDto) {
    const { tagIds, ...contentData } = updateContentDto;

    // 检查内容是否存在
    const existingContent = await this.findOne(id);

    // 如果修改了 slug，检查新 slug 是否已被使用
    if (contentData.slug && contentData.slug !== existingContent.slug) {
      const conflictContent = await this.prisma.content.findUnique({
        where: { slug: contentData.slug },
      });

      if (conflictContent) {
        throw new ConflictException({
          message: `URL标识符 "${contentData.slug}" 已存在`,
          code: BusinessCode.CONFLICT,
        });
      }
    }

    // 验证编辑器类型和内容字段
    if (contentData.editorType) {
      this.validateContentByEditorType(contentData.editorType, contentData);
    }

    // 如果提供了分类ID，验证分类是否存在
    if (contentData.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: contentData.categoryId },
      });

      if (!category) {
        throw new BadRequestException({
          message: '分类不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 如果提供了标签ID，验证标签是否存在
    if (tagIds && tagIds.length > 0) {
      const tags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds } },
      });

      if (tags.length !== tagIds.length) {
        throw new BadRequestException({
          message: '部分标签不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 更新内容
    const content = await this.prisma.content.update({
      where: { id },
      data: {
        ...contentData,
        tags: tagIds !== undefined ? {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatContent(content);
  }

  /**
   * 删除内容
   */
  async remove(id: string) {
    // 检查内容是否存在
    await this.findOne(id);

    await this.prisma.content.delete({
      where: { id },
    });

    return { message: '内容删除成功' };
  }

  /**
   * 发布内容
   */
  async publish(id: string, publishDto: PublishContentDto) {
    const content = await this.findOne(id);

    if (content.status === ContentStatus.PUBLISHED) {
      throw new BadRequestException({
        message: '内容已发布',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    const publishedAt = publishDto.publishedAt ? new Date(publishDto.publishedAt) : new Date();

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt,
      },
      include: {
        author: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatContent(updated);
  }

  /**
   * 撤回发布（变为草稿）
   */
  async unpublish(id: string) {
    const content = await this.findOne(id);

    if (content.status !== ContentStatus.PUBLISHED) {
      throw new BadRequestException({
        message: '内容未发布',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.DRAFT,
      },
      include: {
        author: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatContent(updated);
  }

  /**
   * 归档内容
   */
  async archive(id: string) {
    const content = await this.findOne(id);

    const updated = await this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.ARCHIVED,
      },
      include: {
        author: {
          select: {
            id: true,
            userName: true,
            nickName: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatContent(updated);
  }

  /**
   * 验证内容字段根据编辑器类型
   */
  private validateContentByEditorType(editorType: EditorType, contentData: any) {
    switch (editorType) {
      case EditorType.MARKDOWN:
        if (!contentData.contentMd && !contentData.contentMd === undefined) {
          throw new BadRequestException({
            message: 'Markdown 编辑器需要提供 contentMd 字段',
            code: BusinessCode.VALIDATION_ERROR,
          });
        }
        break;
      case EditorType.RICHTEXT:
        if (!contentData.contentHtml && !contentData.contentHtml === undefined) {
          throw new BadRequestException({
            message: '富文本编辑器需要提供 contentHtml 字段',
            code: BusinessCode.VALIDATION_ERROR,
          });
        }
        break;
      case EditorType.UPLOAD:
        if (!contentData.contentMd && !contentData.contentMd === undefined) {
          throw new BadRequestException({
            message: '上传模式需要提供 contentMd 字段',
            code: BusinessCode.VALIDATION_ERROR,
          });
        }
        break;
    }
  }

  /**
   * 格式化内容数据
   */
  private formatContent(content: any) {
    const { tags, ...contentData } = content;
    return {
      ...contentData,
      tags: tags ? tags.map((ct: any) => ct.tag) : [],
    };
  }
}
