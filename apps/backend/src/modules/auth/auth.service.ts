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
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
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
   * 注意：注册接口仅允许创建普通用户（USER 角色）
   * 管理员账户只能通过数据库迁移或管理员手动创建
   */
  async register(registerDto: RegisterDto) {
    const { email, username, password, firstName, lastName, avatar } = registerDto;

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
      where: { username },
    });

    if (existingUserByUsername) {
      throw new ConflictException({
        message: '用户名已被使用',
        code: BusinessCode.USERNAME_ALREADY_EXISTS,
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（仅创建普通用户，roles 默认为 [USER]）
    // 注意：此处不接受任何 roles 参数，防止用户尝试注册管理员账户
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        avatar,
        // roles 字段不设置，使用 Prisma schema 中的默认值 [USER]
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        roles: true,
        isActive: true,
        createdAt: true,
      },
    });

    // 生成 Token
    const token = await this.generateToken(user);

    return {
      user,
      token,
    };
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 查找用户（支持邮箱或用户名登录）
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
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

    // 检查用户是否激活
    if (!user.isActive) {
      throw new UnauthorizedException({
        message: '账户已被禁用',
        code: BusinessCode.FORBIDDEN,
      });
    }

    // 生成 Token
    const token = await this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles: user.roles,
        isActive: user.isActive,
        createdAt: user.createdAt,
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
      username: user.username,
      roles: user.roles, // 使用 roles 数组
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
    };
  }

  /**
   * 验证 Token（可选功能）
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          roles: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException({
          message: '无效的 Token',
          code: BusinessCode.TOKEN_INVALID,
        });
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException({
        message: 'Token 验证失败',
        code: BusinessCode.TOKEN_INVALID,
      });
    }
  }
}
