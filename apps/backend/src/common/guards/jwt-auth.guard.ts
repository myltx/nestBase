// src/common/guards/jwt-auth.guard.ts
/**
 * JWT 认证守卫（兼容增强版）
 * - 支持通过 `@Public()` 标记公开路由，跳过鉴权
 * - 未标记为公开的路由仍按默认 `AuthGuard('jwt')` 流程校验
 */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 读取处理器/控制器上的 isPublic 元数据，公开路由直接放行
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
