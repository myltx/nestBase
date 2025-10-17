// src/common/decorators/get-user.decorator.ts
/**
 * 获取当前用户装饰器
 * 从请求对象中提取用户信息
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
