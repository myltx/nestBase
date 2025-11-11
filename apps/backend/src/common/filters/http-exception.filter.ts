// src/common/filters/http-exception.filter.ts
/**
 * HTTP 异常过滤器
 * 统一异常响应格式并记录错误日志
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessCode, HTTP_TO_BUSINESS_CODE } from '../constants/business-codes';
import { LogsService } from '@modules/logs/logs.service';
import { ErrorLevel } from '@prisma/client';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private logsService: LogsService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let errors: any = null;
    let businessCode = BusinessCode.INTERNAL_SERVER_ERROR;
    let errorLevel: ErrorLevel = ErrorLevel.ERROR;
    let exceptionType = '系统异常';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 根据 HTTP 状态码映射业务状态码
      businessCode = HTTP_TO_BUSINESS_CODE[status] || BusinessCode.INTERNAL_SERVER_ERROR;

      // 判断异常类型：4xx 为业务异常（warn），5xx 为系统异常（error）
      if (status >= 400 && status < 500) {
        errorLevel = ErrorLevel.WARN;
        exceptionType = '业务异常';
      }

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

    // 获取请求信息
    const user = (request as any).user;
    const userId = user?.id;
    const ip = request.ip || (request.headers['x-forwarded-for'] as string)?.split(',')[0] || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';
    const referer = request.headers['referer'];

    // 错误堆栈（仅系统异常记录）
    const errorStack = errorLevel === ErrorLevel.ERROR && exception instanceof Error
      ? exception.stack
      : undefined;

    // 控制台输出
    const logData = {
      path: request.url,
      method: request.method,
      status,
      message,
      errorLevel,
      exceptionType,
      userId,
      ip,
    };

    if (errorLevel === ErrorLevel.ERROR) {
      this.logger.error('系统异常捕获:', {
        ...logData,
        exception: exception instanceof Error ? exception.stack : exception,
      });
    } else {
      this.logger.warn('业务异常捕获:', logData);
    }

    // 异步记录日志到数据库（不阻塞响应）
    this.recordErrorLog({
      userId,
      method: request.method,
      path: request.url.split('?')[0],
      query: JSON.stringify(request.query),
      statusCode: status,
      ip,
      userAgent,
      referer,
      errorMessage: message,
      errorStack,
      errorLevel,
      exceptionType,
    }).catch((err) => {
      this.logger.error('记录错误日志失败:', err);
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

  /**
   * 记录错误日志到数据库
   */
  private async recordErrorLog(data: {
    userId?: string;
    method: string;
    path: string;
    query?: string;
    statusCode: number;
    ip: string;
    userAgent?: string;
    referer?: string;
    errorMessage?: string;
    errorStack?: string;
    errorLevel?: ErrorLevel;
    exceptionType?: string;
  }) {
    try {
      await this.logsService.createAccessLog(data);
    } catch (error) {
      this.logger.error('记录错误日志到数据库失败:', error);
    }
  }
}
