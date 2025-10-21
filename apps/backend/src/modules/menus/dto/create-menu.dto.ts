// src/modules/menus/dto/create-menu.dto.ts
/**
 * 创建菜单 DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsObject,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class CreateMenuDto {
  @ApiProperty({
    description: '路由唯一标识',
    example: 'home',
  })
  @IsString({ message: '路由标识必须是字符串' })
  routeKey: string;

  @ApiProperty({
    description: '路由路径',
    example: '/home',
  })
  @IsString({ message: '路由路径必须是字符串' })
  routePath: string;

  @ApiProperty({
    description: '菜单名称',
    example: '首页菜单',
  })
  @IsString({ message: '菜单名称必须是字符串' })
  menuName: string;

  @ApiProperty({
    description: '菜单标题',
    example: '首页',
  })
  @IsString({ message: '菜单标题必须是字符串' })
  title: string;

  @ApiPropertyOptional({
    description: '国际化 key',
    example: 'route.home',
  })
  @IsOptional()
  @IsString({ message: '国际化 key 必须是字符串' })
  i18nKey?: string;

  @ApiPropertyOptional({
    description: 'Iconify 图标',
    example: 'mdi:home',
  })
  @IsOptional()
  @IsString({ message: '图标必须是字符串' })
  icon?: string;

  @ApiPropertyOptional({
    description: '本地图标',
    example: 'home',
  })
  @IsOptional()
  @IsString({ message: '本地图标必须是字符串' })
  localIcon?: string;

  @ApiPropertyOptional({
    description: '图标大小',
    example: 18,
  })
  @IsOptional()
  @IsInt({ message: '图标大小必须是整数' })
  @Min(1, { message: '图标大小最小为 1' })
  iconFontSize?: number;

  @ApiPropertyOptional({
    description: '排序',
    example: 0,
  })
  @IsOptional()
  @IsInt({ message: '排序必须是整数' })
  order?: number;

  @ApiPropertyOptional({
    description: '父菜单 ID',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: '父菜单 ID 必须是有效的 UUID' })
  parentId?: string;

  @ApiPropertyOptional({
    description: '菜单类型 (1:目录 2:菜单)',
    example: 2,
  })
  @IsOptional()
  @IsInt({ message: '菜单类型必须是整数' })
  @Min(1, { message: '菜单类型必须是 1 或 2' })
  @Max(2, { message: '菜单类型必须是 1 或 2' })
  menuType?: number;

  @ApiPropertyOptional({
    description: '页面组件路径',
    example: 'views/home/index',
  })
  @IsOptional()
  @IsString({ message: '组件路径必须是字符串' })
  component?: string;

  @ApiPropertyOptional({
    description: '外链地址',
    example: 'https://example.com',
  })
  @IsOptional()
  @IsString({ message: '外链地址必须是字符串' })
  href?: string;

  @ApiPropertyOptional({
    description: '是否在菜单中隐藏',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: '是否隐藏必须是布尔值' })
  hideInMenu?: boolean;

  @ApiPropertyOptional({
    description: '激活的菜单 key',
    example: 'home',
  })
  @IsOptional()
  @IsString({ message: '激活菜单 key 必须是字符串' })
  activeMenu?: string;

  @ApiPropertyOptional({
    description: '是否支持多标签页',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: '是否支持多标签页必须是布尔值' })
  multiTab?: boolean;

  @ApiPropertyOptional({
    description: '固定在标签页的索引',
    example: 0,
  })
  @IsOptional()
  @IsInt({ message: '固定索引必须是整数' })
  @Min(0, { message: '固定索引最小为 0' })
  fixedIndexInTab?: number;

  @ApiPropertyOptional({
    description: '菜单状态 (1:启用 2:禁用)',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: '菜单状态必须是整数' })
  @Min(1, { message: '菜单状态必须是 1 或 2' })
  @Max(2, { message: '菜单状态必须是 1 或 2' })
  status?: number;

  @ApiPropertyOptional({
    description: '是否缓存',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: '是否缓存必须是布尔值' })
  keepAlive?: boolean;

  @ApiPropertyOptional({
    description: '是否为常量路由（无需登录和权限验证）',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: '是否为常量路由必须是布尔值' })
  constant?: boolean;

  @ApiPropertyOptional({
    description: '查询参数 JSON',
    example: [{ key: 'id', value: '1' }],
  })
  @IsOptional()
  @IsObject({ message: '查询参数必须是对象' })
  query?: any;
}
