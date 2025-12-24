import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  QueryProjectDto,
} from './dto';
import { BusinessCode } from '@common/constants/business-codes';

/**
 * 项目服务
 * 处理项目的 CRUD 业务逻辑
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建项目
   */
  async create(createProjectDto: CreateProjectDto) {
    try {
      const project = await this.prisma.project.create({
        data: createProjectDto,
      });

      return project;
    } catch (error) {
      throw new BadRequestException({
        message: '创建项目失败',
        code: BusinessCode.BAD_REQUEST,
      });
    }
  }

  /**
   * 查询项目列表（分页、搜索、筛选）
   */
  async findAll(queryDto: QueryProjectDto) {
    const {
      current = 1,
      size = 10,
      search,
      featured,
      tech,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    // 构建查询条件
    const where: any = {};

    // 搜索条件（标题或描述包含关键词）
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 精选筛选
    if (featured !== undefined) {
      where.featured = featured;
    }

    // 技术栈筛选
    if (tech) {
      where.tech = {
        has: tech,
      };
    }

    // 计算分页
    const skip = (current - 1) * size;

    // 查询数据和总数
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: size,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    // 返回分页数据
    return {
      records: projects,
      current,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }



  /**
   * 根据 ID 查询单个项目
   */
  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException({
        message: `项目 #${id} 不存在`,
        code: BusinessCode.RESOURCE_NOT_FOUND,
      });
    }

    return project;
  }

  /**
   * 更新项目
   */
  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // 检查项目是否存在
    await this.findOne(id);

    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: updateProjectDto,
      });

      return project;
    } catch (error) {
      throw new BadRequestException({
        message: '更新项目失败',
        code: BusinessCode.BAD_REQUEST,
      });
    }
  }

  /**
   * 删除项目
   */
  async remove(id: string) {
    // 检查项目是否存在
    await this.findOne(id);

    try {
      await this.prisma.project.delete({
        where: { id },
      });

      return { message: '项目删除成功' };
    } catch (error) {
      throw new BadRequestException({
        message: '删除项目失败',
        code: BusinessCode.BAD_REQUEST,
      });
    }
  }



  /**
   * 获取所有使用的技术栈（去重）
   */
  async getTechStack() {
    const projects = await this.prisma.project.findMany({
      select: {
        tech: true,
      },
    });

    // 提取所有技术栈并去重
    const techSet = new Set<string>();
    projects.forEach((project) => {
      project.tech.forEach((t) => techSet.add(t));
    });

    return Array.from(techSet).sort();
  }
}
