// src/common/decorators/public.decorator.ts
/**
 * 公共路由装饰器
 * 用于标记不需要 JWT 认证的路由
 */

// src/common/decorators/public.decorator.ts
/**
 * 公开访问装饰器
 * - 为路由/控制器设置 `isPublic` 元数据
 * - 由 `JwtAuthGuard` 读取后跳过鉴权
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
