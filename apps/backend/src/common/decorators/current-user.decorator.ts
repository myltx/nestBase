// src/common/decorators/current-user.decorator.ts
/**
 * 当前用户装饰器
 * 用于从请求中提取当前登录用户信息
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user?.[data] : user;
});
