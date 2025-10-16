import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsUrl,
} from 'class-validator';

/**
 * 创建项目 DTO
 */
export class CreateProjectDto {
  @ApiProperty({
    description: '项目标题',
    example: '极客博客系统',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '项目描述',
    example:
      '基于Nuxt.js + TypeScript + UnoCSS构建的现代化博客系统，支持Markdown写作、代码高亮、全文搜索等功能',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: '项目 URL',
    example: 'https://mindlog.myltx.top',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  url?: string;

  @ApiProperty({
    description: '技术栈',
    type: [String],
    example: ['Nuxt.js', 'TypeScript', 'UnoCSS', 'Nuxt Content'],
  })
  @IsArray()
  @IsString({ each: true })
  tech: string[];

  @ApiProperty({
    description: 'GitHub 仓库地址',
    example: 'https://github.com/mindLog',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  github?: string;

  @ApiProperty({
    description: '在线演示地址',
    example: 'https://mindlog.myltx.top',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  demo?: string;

  @ApiProperty({
    description: '是否为精选项目',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
