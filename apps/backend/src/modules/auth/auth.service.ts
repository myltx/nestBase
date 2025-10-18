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
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
      throw new UnauthorizedException({
        message: '用户名或密码错误',
        code: BusinessCode.INVALID_CREDENTIALS,
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: '用户名或密码错误',
        code: BusinessCode.INVALID_CREDENTIALS,
      });
    }

    // 检查用户状态
    if (user.status !== UserStatus.ENABLED) {
      throw new UnauthorizedException({
        message: '账户已被禁用',
        code: BusinessCode.FORBIDDEN,
      });
    }

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
   * 生成 JWT Token
   */
  private async generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      userName: user.userName,
      roles: user.roles, // 使用 roles 数组(角色code字符串数组)
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
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

      if (!user || user.status !== UserStatus.ENABLED) {
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
}
