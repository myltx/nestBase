// src/modules/auth/auth.service.ts
/**
 * 认证服务
 * 处理用户注册、登录等认证相关逻辑
 */

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';
import { LogsService } from '../logs/logs.service';
import { LoginStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private logsService: LogsService,
    @Inject(REQUEST) private request: Request,
  ) {}

  /**
   * 用户注册
   * 注意:注册接口仅允许创建普通用户(USER 角色)
   * 管理员账户只能通过数据库迁移或管理员手动创建
   */
  async register(registerDto: RegisterDto) {
    const { email, userName, password, nickName, firstName, lastName, phone, gender, avatar } = registerDto;

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ConflictException({
        message: '邮箱已被注册',
        code: BusinessCode.EMAIL_ALREADY_EXISTS,
      });
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { userName },
    });

    if (existingUserByUsername) {
      throw new ConflictException({
        message: '用户名已被使用',
        code: BusinessCode.USERNAME_ALREADY_EXISTS,
      });
    }

    // 检查手机号是否已存在(如果提供)
    if (phone) {
      const existingUserByPhone = await this.prisma.user.findUnique({
        where: { phone },
      });

      if (existingUserByPhone) {
        throw new ConflictException({
          message: '手机号已被使用',
          code: BusinessCode.VALIDATION_ERROR,
        });
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 获取 USER 角色
    const userRole = await this.prisma.role.findUnique({
      where: { code: 'USER' },
    });

    if (!userRole) {
      throw new BadRequestException({
        message: '系统角色未初始化',
        code: BusinessCode.SYSTEM_ERROR,
      });
    }

    // 创建用户并分配 USER 角色
    const user = await this.prisma.user.create({
      data: {
        email,
        userName,
        password: hashedPassword,
        nickName,
        firstName,
        lastName,
        phone,
        gender,
        avatar,
        userRoles: {
          create: {
            roleId: userRole.id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        userName: true,
        nickName: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        avatar: true,
        status: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 提取角色code数组
    const roles = user.userRoles.map((ur) => ur.role.code);

    // 生成 Token
    const token = await this.generateToken({ ...user, roles });

    return {
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        nickName: user.nickName,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        gender: user.gender,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
        roles,
      },
      token,
    };
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    const { userName, password } = loginDto;

    // 获取请求信息
    const ip = this.request.ip || (this.request.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
    const userAgent = this.request.headers['user-agent'] || 'unknown';

    // 查找用户(支持邮箱或用户名登录)
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ userName }, { email: userName }],
      },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      // 记录登录失败日志
      await this.logsService.createLoginLog({
        email: userName,
        ip,
        userAgent,
        status: LoginStatus.FAILED,
        failReason: '用户名或密码错误',
      });

      throw new UnauthorizedException({
        message: '用户名或密码错误',
        code: BusinessCode.INVALID_CREDENTIALS,
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // 记录登录失败日志
      await this.logsService.createLoginLog({
        userId: user.id,
        email: user.email,
        ip,
        userAgent,
        status: LoginStatus.FAILED,
        failReason: '用户名或密码错误',
      });

      throw new UnauthorizedException({
        message: '用户名或密码错误',
        code: BusinessCode.INVALID_CREDENTIALS,
      });
    }

    // 检查用户状态
    if (user.status !== 1) {
      // 记录登录失败日志
      await this.logsService.createLoginLog({
        userId: user.id,
        email: user.email,
        ip,
        userAgent,
        status: LoginStatus.FAILED,
        failReason: '账户已被禁用',
      });

      throw new UnauthorizedException({
        message: '账户已被禁用',
        code: BusinessCode.FORBIDDEN,
      });
    }

    // 提取角色code数组
    const roles = user.userRoles.map((ur) => ur.role.code);

    // 生成 Token
    const token = await this.generateToken({ ...user, roles });

    // 记录登录成功日志
    await this.logsService.createLoginLog({
      userId: user.id,
      email: user.email,
      ip,
      userAgent,
      status: LoginStatus.SUCCESS,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        nickName: user.nickName,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        gender: user.gender,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
        roles,
      },
      token,
    };
  }

  /**
   * 生成 JWT Token（包含 Access Token 和 Refresh Token）
   */
  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      userName: user.userName,
      roles: user.roles, // 使用 roles 数组(角色code字符串数组)
    };

    // Access Token (短期，用于 API 访问)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    // Refresh Token (长期，用于刷新 Access Token)
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    };
  }

  /**
   * 验证 Token(可选功能)
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          userName: true,
          firstName: true,
          lastName: true,
          avatar: true,
          status: true,
          userRoles: {
            include: {
              role: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!user || user.status !== 1) {
        throw new UnauthorizedException({
          message: '无效的 Token',
          code: BusinessCode.TOKEN_INVALID,
        });
      }

      // 提取角色code数组
      const roles = user.userRoles.map((ur) => ur.role.code);

      return {
        ...user,
        roles,
      };
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Token 验证失败',
        code: BusinessCode.TOKEN_INVALID,
      });
    }
  }

  /**
   * 获取当前用户的所有权限
   * @param userId 用户ID
   * @returns 权限代码数组
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    // 1. 获取用户的所有角色ID
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { roleId: true },
    });

    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return [];
    }

    // 2. 获取这些角色的所有权限
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
      },
      include: {
        permission: {
          select: {
            code: true,
            status: true,
          },
        },
      },
    });

    // 3. 提取权限代码（去重 + 只取启用的权限）
    const permissionCodes = [
      ...new Set(
        rolePermissions
          .filter((rp) => rp.permission.status === 1)
          .map((rp) => rp.permission.code)
      ),
    ];

    return permissionCodes;
  }

  /**
   * 刷新 Access Token
   * @param refreshToken Refresh Token
   * @returns 新的 Access Token 和 Refresh Token
   */
  async refreshToken(refreshToken: string) {
    try {
      // 验证 Refresh Token
      const payload = this.jwtService.verify(refreshToken);

      // 检查是否是 refresh token 类型
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException({
          message: '无效的 Refresh Token',
          code: BusinessCode.TOKEN_INVALID,
        });
      }

      // 获取用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: '用户不存在',
          code: BusinessCode.USER_NOT_FOUND,
        });
      }

      // 检查用户状态
      if (user.status !== 1) {
        throw new UnauthorizedException({
          message: '账户已被禁用',
          code: BusinessCode.FORBIDDEN,
        });
      }

      // 提取角色code数组
      const roles = user.userRoles.map((ur) => ur.role.code);

      // 生成新的 Token
      const token = await this.generateToken({ ...user, roles });

      return {
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          nickName: user.nickName,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          gender: user.gender,
          avatar: user.avatar,
          status: user.status,
          roles,
        },
        token,
      };
    } catch (error) {
      // JWT 验证失败或过期
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Refresh Token 已过期，请重新登录',
          code: BusinessCode.TOKEN_EXPIRED,
        });
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          message: '无效的 Refresh Token',
          code: BusinessCode.TOKEN_INVALID,
        });
      }

      // 重新抛出其他异常
      throw error;
    }
  }

  /**
   * 退出登录
   * 注意：由于 JWT 是无状态的，实际上只是返回成功消息
   * 客户端需要删除本地存储的 token
   * 如果需要真正的 token 失效，需要实现 token 黑名单机制（需要 Redis）
   */
  async logout(userId: string) {
    // 这里可以添加额外的逻辑，比如：
    // 1. 记录审计日志
    // 2. 将 token 加入黑名单（需要 Redis）
    // 3. 清除用户的会话信息

    return {
      message: '退出登录成功',
    };
  }
}
