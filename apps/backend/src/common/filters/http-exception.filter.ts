// src/common/filters/http-exception.filter.ts
/**
 * HTTP 异常过滤器
 * 统一异常响应格式
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessCode, HTTP_TO_BUSINESS_CODE } from '../constants/business-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let errors: any = null;
    let businessCode = BusinessCode.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 根据 HTTP 状态码映射业务状态码
      businessCode = HTTP_TO_BUSINESS_CODE[status] || BusinessCode.INTERNAL_SERVER_ERROR;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        errors = responseObj.errors || responseObj.error || null;

        // 如果响应中包含自定义的 code，使用它
        if (responseObj.code !== undefined) {
          businessCode = responseObj.code;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    console.error('异常捕获:', {
      path: request.url,
      method: request.method,
      status,
      message,
      exception: exception instanceof Error ? exception.stack : exception,
    });

    response.status(status).json({
      code: businessCode,
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
