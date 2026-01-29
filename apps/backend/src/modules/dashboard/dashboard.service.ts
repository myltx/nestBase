/**
 * 仪表盘服务
 * 提供系统级统计数据
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取系统概览统计
   */
  async getStats() {
    const [userCount, roleCount, menuCount] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.menu.count(),
    ]);

    return {
      users: userCount,
      roles: roleCount,
      menus: menuCount,
    };
  }
}
