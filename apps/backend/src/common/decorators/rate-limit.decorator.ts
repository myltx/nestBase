// src/common/decorators/rate-limit.decorator.ts
/**
 * API 限流装饰器
 * - 为路由设置限流元数据，由 RateLimitGuard 读取并执行
 */
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_META = 'rateLimitMeta';

export interface RateLimitOptions {
  key?: string; // 业务键（可选，不设置则用 控制器#方法）
  ttl: number; // 秒
  limit: number; // 窗口内允许次数
}

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_META, options);

