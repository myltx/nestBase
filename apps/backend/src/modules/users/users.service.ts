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
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { BusinessCode } from '@common/constants/business-codes';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
    isActive: true,
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
    const { email, userName, password, nickName, firstName, lastName, phone, gender, avatar, roleIds } = createUserDto;

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

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

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

    // 格式化返回数据
    return this.formatUser(user);
  }

  /**
   * 查询所有用户(支持分页和搜索)
   */
  async findAll(queryDto: QueryUserDto) {
    const { search, role, current = '1', size = '10' } = queryDto;

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

    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
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
  async update(id: string, updateUserDto: UpdateUserDto) {
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

    if (updateUserDto.isActive !== undefined) {
      updateData.isActive = updateUserDto.isActive;
    }

    // 如果更新密码,需要加密
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 处理角色更新
    if (updateUserDto.roleIds !== undefined) {
      // 验证角色ID是否存在
      const roles = await this.prisma.role.findMany({
        where: {
          id: {
            in: updateUserDto.roleIds,
          },
        },
      });

      if (roles.length !== updateUserDto.roleIds.length) {
        throw new BadRequestException({
          message: '部分角色 ID 不存在',
          code: BusinessCode.NOT_FOUND,
        });
      }
    }

    // 使用事务更新用户和角色
    const user = await this.prisma.$transaction(async (prisma) => {
      // 更新用户基本信息
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: this.userSelect,
      });

      // 如果需要更新角色
      if (updateUserDto.roleIds !== undefined) {
        // 删除现有角色关联
        await prisma.userRole.deleteMany({
          where: { userId: id },
        });

        // 创建新的角色关联
        if (updateUserDto.roleIds.length > 0) {
          await prisma.userRole.createMany({
            data: updateUserDto.roleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }

        // 重新查询用户以获取最新角色
        return prisma.user.findUnique({
          where: { id },
          select: this.userSelect,
        });
      }

      return updatedUser;
    });

    return this.formatUser(user);
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
}
