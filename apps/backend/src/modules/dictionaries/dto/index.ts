import { IsString, IsOptional, IsBoolean, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDictionaryDto {
  @ApiProperty({ description: '字典编码', example: 'user_gender' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: '字典名称', example: '用户性别' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDictionaryDto {
  @ApiPropertyOptional({ description: '字典名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateDictionaryItemDto {
  @ApiProperty({ description: '显示文本', example: '男' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: '存储值', example: '1' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsInt()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '展示颜色' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: '状态', default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class UpdateDictionaryItemDto {
  @ApiPropertyOptional({ description: '显示文本' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ description: '存储值' })
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsInt()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '展示颜色' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: '状态' })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}

export class QueryDictionaryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '搜索关键词(名称或编码)' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
