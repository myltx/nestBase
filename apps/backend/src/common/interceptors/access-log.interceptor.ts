// src/common/interceptors/access-log.interceptor.ts
/**
 * 访问日志拦截器
 * 自动记录所有HTTP请求的访问日志
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LogsService } from '@modules/logs/logs.service';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AccessLogInterceptor.name);

  constructor(private logsService: LogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const { method, originalUrl, query, headers, user, ip } = request;
    const path = originalUrl.split('?')[0];
    const userId = user?.id;
    const userAgent = headers['user-agent'];
    const referer = headers['referer'];

    return next.handle().pipe(
      tap(() => {
        // 请求成功 - 仅记录成功的访问日志
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // 异步记录日志,不阻塞响应
        this.recordLog({
          userId,
          method,
          path,
          query: JSON.stringify(query),
          statusCode,
          ip,
          userAgent,
          referer,
          responseTime,
        });
      }),
      catchError((error) => {
        // 请求失败 - 不记录错误日志（由异常过滤器统一处理）
        return throwError(() => error);
      }),
    );
  }

  private async recordLog(data: {
    userId?: string;
    method: string;
    path: string;
    query?: string;
    statusCode: number;
    ip: string;
    userAgent?: string;
    referer?: string;
    responseTime?: number;
    errorMessage?: string;
  }) {
    try {
      // 过滤掉不需要记录的路径
      const excludePaths = ['/api/system/status', '/api-docs', '/api/swagger'];
      if (excludePaths.some(excludePath => data.path.startsWith(excludePath))) {
        return;
      }

      await this.logsService.createAccessLog(data);
    } catch (error) {
      this.logger.error('记录访问日志失败:', error);
    }
  }
}
