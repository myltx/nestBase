// src/common/guards/rate-limit.guard.ts
/**
 * API 限流守卫（进程内令牌桶/计数器）
 * - 仅对标注了 @RateLimit(...) 的路由生效
 * - 识别身份：优先 user.id，次选 req.ip
 * - 适用：简单防刷/防滥用；生产集群环境建议接入分布式限流中间件
 */
import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_META, RateLimitOptions } from '../decorators/rate-limit.decorator';

type Counter = { count: number; resetAt: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store = new Map<string, Counter>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const handlerMeta = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(RATE_LIMIT_META, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!handlerMeta) return true; // 未设置限流则跳过

    const req = context.switchToHttp().getRequest();
    const userId = req?.user?.id || req?.user?.userId; // 兼容不同策略
    const ip = req?.ip || req?.socket?.remoteAddress || 'unknown';

    const ctrl = context.getClass()?.name || 'Controller';
    const method = context.getHandler()?.name || 'handler';
    const keyBase = handlerMeta.key || `${ctrl}#${method}`;
    const actor = userId || ip;
    const key = `${keyBase}:${actor}`;

    const now = Date.now();
    const ttlMs = handlerMeta.ttl * 1000;
    const rec = this.store.get(key);

    if (!rec || now >= rec.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + ttlMs });
      return true;
    }

    if (rec.count >= handlerMeta.limit) {
      const retryAfter = Math.max(0, Math.ceil((rec.resetAt - now) / 1000));
      throw new HttpException(`请求过于频繁，请在 ${retryAfter}s 后重试`, HttpStatus.TOO_MANY_REQUESTS);
    }

    rec.count += 1;
    return true;
  }
}
