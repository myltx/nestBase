// src/common/interceptors/transform.interceptor.ts
/**
 * 响应转换拦截器
 * 统一 API 响应格式
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';
import { BusinessCode } from '../constants/business-codes';

export interface Response<T> {
  code: number;
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    // 检查是否跳过转换
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform) {
      // 直接返回原始数据，不做转换
      return next.handle();
    }

    // 正常转换
    return next.handle().pipe(
      map((data) => ({
        code: BusinessCode.SUCCESS,
        success: true,
        data: data,
        message: 'success',
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
