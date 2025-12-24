// src/modules/logs/logs.service.ts
/**
 * 日志服务
 * 处理访问日志和登录日志的CRUD操作
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAccessLogDto, QueryLoginLogDto } from './dto';
import { LoginStatus, ErrorLevel } from '@prisma/client';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建访问日志
   */
  async createAccessLog(data: {
    userId?: string;
    method: string;
    path: string;
    query?: string;
    statusCode: number;
    ip: string;
    userAgent?: string;
    referer?: string;
    responseTime?: number;
    errorMessage?: string;
    errorStack?: string;
    errorLevel?: ErrorLevel;
    exceptionType?: string;
  }) {
    return this.prisma.accessLog.create({
      data,
    });
  }

  /**
   * 查询访问日志列表
   */
  async findAllAccessLogs(queryDto: QueryAccessLogDto) {
    const {
      userId,
      method,
      path,
      statusCode,
      ip,
      startDate,
      endDate,
      current = '1',
      size = '10',
    } = queryDto;

    const pageNum = parseInt(current, 10);
    const limitNum = parseInt(size, 10);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (method) {
      where.method = method;
    }

    if (path) {
      where.path = { contains: path, mode: 'insensitive' };
    }

    if (statusCode) {
      where.statusCode = statusCode;
    }

    if (ip) {
      where.ip = ip;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              nickName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      records,
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * 创建登录日志
   */
  async createLoginLog(data: {
    userId?: string;
    email: string;
    status: LoginStatus;
    ip: string;
    userAgent?: string;
    failReason?: string;
  }) {
    return this.prisma.loginLog.create({
      data,
    });
  }

  /**
   * 查询登录日志列表
   */
  async findAllLoginLogs(queryDto: QueryLoginLogDto) {
    const {
      userId,
      email,
      status,
      ip,
      startDate,
      endDate,
      current = '1',
      size = '10',
    } = queryDto;

    const pageNum = parseInt(current, 10);
    const limitNum = parseInt(size, 10);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (ip) {
      where.ip = ip;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [records, total] = await Promise.all([
      this.prisma.loginLog.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              nickName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.loginLog.count({ where }),
    ]);

    return {
      records,
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * 获取访问日志统计信息
   */
  async getAccessLogStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [
      totalCount,
      successCount,
      errorCount,
      uniqueUsers,
      uniqueIps,
      avgResponseTime,
      topPaths,
      statusCodeDistribution,
    ] = await Promise.all([
      // 总访问量
      this.prisma.accessLog.count({ where }),

      // 成功请求数 (2xx, 3xx)
      this.prisma.accessLog.count({
        where: {
          ...where,
          statusCode: { gte: 200, lt: 400 },
        },
      }),

      // 错误请求数 (4xx, 5xx)
      this.prisma.accessLog.count({
        where: {
          ...where,
          statusCode: { gte: 400 },
        },
      }),

      // 独立用户数
      this.prisma.accessLog.findMany({
        where: { ...where, userId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      }).then((users) => users.length),

      // 独立IP数
      this.prisma.accessLog.findMany({
        where,
        select: { ip: true },
        distinct: ['ip'],
      }).then((ips) => ips.length),

      // 平均响应时间
      this.prisma.accessLog.aggregate({
        where: { ...where, responseTime: { not: null } },
        _avg: { responseTime: true },
      }).then((result) => result._avg.responseTime || 0),

      // 访问最多的路径 TOP 10
      this.prisma.$queryRaw`
        SELECT path, COUNT(*) as count
        FROM access_logs
        ${where.createdAt ? this.prisma.$queryRaw`WHERE created_at >= ${where.createdAt.gte} AND created_at <= ${where.createdAt.lte || new Date()}` : this.prisma.$queryRaw``}
        GROUP BY path
        ORDER BY count DESC
        LIMIT 10
      `,

      // 状态码分布
      this.prisma.$queryRaw`
        SELECT
          CASE
            WHEN status_code >= 200 AND status_code < 300 THEN '2xx'
            WHEN status_code >= 300 AND status_code < 400 THEN '3xx'
            WHEN status_code >= 400 AND status_code < 500 THEN '4xx'
            WHEN status_code >= 500 THEN '5xx'
          END as status_range,
          COUNT(*) as count
        FROM access_logs
        ${where.createdAt ? this.prisma.$queryRaw`WHERE created_at >= ${where.createdAt.gte} AND created_at <= ${where.createdAt.lte || new Date()}` : this.prisma.$queryRaw``}
        GROUP BY status_range
        ORDER BY status_range
      `,
    ]);

    return {
      totalCount,
      successCount,
      errorCount,
      uniqueUsers,
      uniqueIps,
      avgResponseTime: Math.round(avgResponseTime as number),
      topPaths,
      statusCodeDistribution,
    };
  }

  /**
   * 获取登录日志统计信息
   */
  async getLoginLogStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [
      totalCount,
      successCount,
      failedCount,
      logoutCount,
      uniqueUsers,
      uniqueIps,
      topFailReasons,
    ] = await Promise.all([
      // 总登录次数
      this.prisma.loginLog.count({ where }),

      // 成功登录数
      this.prisma.loginLog.count({
        where: { ...where, status: LoginStatus.SUCCESS },
      }),

      // 失败登录数
      this.prisma.loginLog.count({
        where: { ...where, status: LoginStatus.FAILED },
      }),

      // 退出登录数
      this.prisma.loginLog.count({
        where: { ...where, status: LoginStatus.LOGOUT },
      }),

      // 独立用户数
      this.prisma.loginLog.findMany({
        where: { ...where, userId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      }).then((users) => users.length),

      // 独立IP数
      this.prisma.loginLog.findMany({
        where,
        select: { ip: true },
        distinct: ['ip'],
      }).then((ips) => ips.length),

      // 登录失败原因 TOP 5
      this.prisma.$queryRaw`
        SELECT fail_reason, COUNT(*) as count
        FROM login_logs
        WHERE status = 'FAILED' AND fail_reason IS NOT NULL
        ${where.createdAt ? this.prisma.$queryRaw`AND created_at >= ${where.createdAt.gte} AND created_at <= ${where.createdAt.lte || new Date()}` : this.prisma.$queryRaw``}
        GROUP BY fail_reason
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

    return {
      totalCount,
      successCount,
      failedCount,
      logoutCount,
      uniqueUsers,
      uniqueIps,
      successRate: totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(2) + '%' : '0%',
      topFailReasons,
    };
  }
}
