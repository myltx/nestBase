// src/modules/user-roles/dto/get-role-users.dto.ts
/**
 * 角色下用户列表查询 DTO（分页/搜索）
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetRoleUsersQueryDto {
  @ApiPropertyOptional({ description: '页码（>=1）', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页条数（1-100）', default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '搜索关键字（用户名/邮箱）' })
  @IsString()
  @IsOptional()
  search?: string;
}

