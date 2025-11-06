// src/modules/audit/audit.service.ts
/**
 * 审计日志服务
 * 记录关键操作（如角色变更、权限修改等）
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogData {
  event: string; // 事件名称，如 "role:update"
  userId?: string; // 操作用户ID
  ipAddress?: string; // IP地址
  userAgent?: string; // 用户代理
  resource?: string; // 资源类型，如 "Role", "Permission"
  resourceId?: string; // 资源ID
  action?: string; // 操作类型，如 "CREATE", "UPDATE", "DELETE"
  payload: Record<string, any>; // 详细数据
  result?: string; // 操作结果：SUCCESS, FAILED
  errorMsg?: string; // 错误信息
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 记录审计日志
   * @param data 审计日志数据
   */
  async log(data: AuditLogData) {
    const {
      event,
      userId,
      ipAddress,
      userAgent,
      resource,
      resourceId,
      action,
      payload,
      result = 'SUCCESS',
      errorMsg,
    } = data;

    // 输出到应用日志
    this.logger.log(
      `[AUDIT] ${event} | User: ${userId || 'system'} | Action: ${action || 'N/A'} | Result: ${result}`,
      JSON.stringify(payload),
    );

    // 持久化到数据库
    try {
      await this.prisma.auditLog.create({
        data: {
          event,
          userId,
          ipAddress,
          userAgent,
          resource,
          resourceId,
          action,
          payload,
          result,
          errorMsg,
        },
      });
    } catch (error) {
      this.logger.warn(
        `写入审计数据库失败: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 查询审计日志（分页）
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    event?: string;
    userId?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { skip = 0, take = 20, event, userId, resource, startDate, endDate } = params;

    const where: any = {};
    if (event) where.event = { contains: event };
    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * 根据ID查询审计日志
   */
  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            email: true,
            nickName: true,
          },
        },
      },
    });
  }
}
