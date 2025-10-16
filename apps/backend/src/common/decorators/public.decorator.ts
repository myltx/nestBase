// src/common/decorators/public.decorator.ts
/**
 * 公共路由装饰器
 * 用于标记不需要 JWT 认证的路由
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
