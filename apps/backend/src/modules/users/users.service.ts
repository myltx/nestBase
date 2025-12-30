// src/modules/users/users.service.ts
/**
 * 用户服务
 * 处理用户相关的业务逻辑
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '@modules/redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 生成随机密码
   * 包含大小写字母、数字和特殊字符
   */
  private generateRandomPassword(length = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + special;

    let password = '';
    // 确保包含至少一个大写字母、小写字母、数字和特殊字符
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 打乱字符顺序
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * 用户字段选择器(排除密码)
   */
  private readonly userSelect = {
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
    updatedAt: true,
    userRoles: {
      include: {
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    },
  };

  /**
   * 创建用户
   */
  async create(createUserDto: CreateUserDto) {
    const {
      email,
      userName,
      password,
      nickName,
      firstName,
      lastName,
      phone,
      gender,
      avatar,
      roleIds,
    } = createUserDto;

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

    // 如果没有提供角色ID,默认分配 USER 角色
    let assignRoleIds = roleIds;
    if (!assignRoleIds || assignRoleIds.length === 0) {
      const userRole = await this.prisma.role.findUnique({
        where: { code: 'USER' },
      });

      if (!userRole) {
        throw new BadRequestException({
          message: '系统角色未初始化',
          code: BusinessCode.SYSTEM_ERROR,
        });
      }

      assignRoleIds = [userRole.id];
    } else {
      // 验证角色ID是否存在
      const roles = await this.prisma.role.findMany({
        where: {
          id: {
            in: assignRoleIds,
          },
        },
      });

      if (roles.length !== assignRoleIds.length) {
        throw new BadRequestException({
          message: '部分角色 ID 不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 如果未提供密码，生成随机密码
    const plainPassword = password || this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 创建用户并分配角色
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
          create: assignRoleIds.map((roleId) => ({
            roleId,
          })),
        },
      },
      select: this.userSelect,
    });

    // 格式化返回数据,并附加生成的密码（仅当自动生成时）
    const result = this.formatUser(user);
    if (!password) {
      return {
        ...result,
        generatedPassword: plainPassword,
      };
    }
    return result;
  }

  /**
   * 查询所有用户(支持分页和搜索)
   */
  /**
   * 查询所有用户(支持分页和搜索)
   */
  async findAll(queryDto: QueryUserDto) {
    const { search, userName, email, nickName, gender, phone, status, role, current, size } =
      queryDto;

    // 构建查询条件
    const where: any = {};

    // 关键词搜索（用户名、邮箱、名字、姓氏）
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 用户名筛选
    if (userName) {
      where.userName = { contains: userName, mode: 'insensitive' };
    }

    // 邮箱筛选
    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    // 昵称筛选（模糊匹配）
    if (nickName) {
      where.nickName = { contains: nickName, mode: 'insensitive' };
    }

    // 性别筛选
    if (gender) {
      where.gender = gender;
    }

    // 手机号筛选（精确匹配）
    if (phone) {
      where.phone = phone;
    }

    // 用户状态筛选
    if (status !== undefined) {
      where.status = status;
    }

    // 支持按角色code筛选
    if (role) {
      where.userRoles = {
        some: {
          role: {
            code: role,
          },
        },
      };
    }

    // 如果未请求分页，返回所有符合条件的结果
    if (!current && !size) {
      const users = await this.prisma.user.findMany({
        where,
        select: this.userSelect,
        orderBy: {
          createdAt: 'desc',
        },
      });
      return users.map((user) => this.formatUser(user));
    }

    // 处理分页
    const pageNum = parseInt(current || '1', 10);
    const limitNum = parseInt(size || '10', 10);

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException({
        message: '页码和每页数量必须大于 0',
        code: BusinessCode.VALIDATION_ERROR,
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // 查询用户(排除密码字段)
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: this.userSelect,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      records: users.map((user) => this.formatUser(user)),
      current: pageNum,
      size: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * 根据 ID 查询用户(排除密码)
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException({
        message: `用户 ID ${id} 不存在`,
        code: BusinessCode.USER_NOT_FOUND,
      });
    }

    return this.formatUser(user);
  }

  /**
   * 更新用户
   */
  async update(id: string, updateUserDto: UpdateUserDto, actorId?: string) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException({
        message: `用户 ID ${id} 不存在`,
        code: BusinessCode.USER_NOT_FOUND,
      });
    }

    // 准备更新数据
    const updateData: any = {};

    if (updateUserDto.nickName !== undefined) {
      updateData.nickName = updateUserDto.nickName;
    }

    if (updateUserDto.firstName !== undefined) {
      updateData.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName !== undefined) {
      updateData.lastName = updateUserDto.lastName;
    }

    if (updateUserDto.phone !== undefined) {
      // 检查手机号是否已被其他用户使用
      if (updateUserDto.phone) {
        const existingUserByPhone = await this.prisma.user.findUnique({
          where: { phone: updateUserDto.phone },
        });

        if (existingUserByPhone && existingUserByPhone.id !== id) {
          throw new ConflictException({
            message: '手机号已被使用',
            code: BusinessCode.VALIDATION_ERROR,
          });
        }
      }
      updateData.phone = updateUserDto.phone;
    }

    if (updateUserDto.gender !== undefined) {
      updateData.gender = updateUserDto.gender;
    }

    if (updateUserDto.avatar !== undefined) {
      updateData.avatar = updateUserDto.avatar;
    }

    if (updateUserDto.status !== undefined) {
      updateData.status = updateUserDto.status;
    }

    // 如果更新密码,需要加密
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 更新用户基本信息
    await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // 如果需要更新角色，调用 UserRolesService（统一审计日志）
    if (updateUserDto.roleIds !== undefined) {
      await this.setUserRoles(id, updateUserDto.roleIds, actorId);
    }

    // 重新查询用户以获取最新数据（包括角色）
    const updatedUser = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    return this.formatUser(updatedUser);
  }

  /**
   * 删除用户
   */
  async remove(id: string) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException({
        message: `用户 ID ${id} 不存在`,
        code: BusinessCode.USER_NOT_FOUND,
      });
    }

    // 删除用户(会级联删除 userRoles)
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '用户删除成功' };
  }

  /**
   * 批量删除用户
   */
  async batchRemove(ids: string[], actorId?: string) {
    if (ids.length === 0) {
      return { message: '删除成功(未选择任何用户)' };
    }

    const result = await this.prisma.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    if (result.count > 0) {
      await this.audit.log({
        event: 'user.batch_delete',
        userId: actorId,
        resource: 'User',
        resourceId: JSON.stringify(ids),
        action: 'DELETE',
        payload: {
          ids,
          count: result.count,
        },
      });

      // 清除缓存
      await this.invalidatePermissionCache(ids);
    }

    return { message: `成功删除 ${result.count} 个用户` };
  }

  /**
   * 格式化用户数据,将 userRoles 转换为 roles 数组
   */
  private formatUser(user: any) {
    const { userRoles, ...userData } = user;
    return {
      ...userData,
      roles: userRoles.map((ur: any) => ({
        id: ur.role.id,
        code: ur.role.code,
        name: ur.role.name,
      })),
    };
  }

  private async invalidatePermissionCache(userIds: string | string[]) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    if (ids.length === 0) {
      return;
    }
    const keys = ids.map((id) => `permissions:${id}`);
    await this.redisService.del(...keys);
  }

  /**
   * 获取用户的角色列表
   */
  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user.userRoles.map((ur) => ur.role);
  }

  /**
   * 设置用户的角色（完全替换）
   */
  async setUserRoles(userId: string, roleIds: string[], actorId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (roleIds.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } },
      });

      if (roles.length !== roleIds.length) {
        const foundIds = roles.map((r) => r.id);
        const missingIds = roleIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(`以下角色不存在: ${missingIds.join(', ')}`);
      }
    }

    const beforeRoles = await this.getUserRoles(userId);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.userRole.deleteMany({
          where: { userId },
        });

        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({
              userId,
              roleId,
            })),
          });
        }
      });

      await this.audit.log({
        event: 'user.roles.set',
        userId: actorId,
        resource: 'User',
        resourceId: userId,
        action: 'UPDATE',
        payload: {
          actorId,
          userId,
          before: beforeRoles.map((r) => r.id),
          after: roleIds,
        },
      });

      await this.invalidatePermissionCache(userId);

      return {
        userId,
        roleIds,
        message: '用户角色设置成功',
      };
    } catch (error) {
      throw new InternalServerErrorException('设置用户角色失败');
    }
  }
}
