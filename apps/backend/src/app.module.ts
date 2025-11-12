// src/app.module.ts
/**
 * 应用主模块
 * 整合所有功能模块
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MenusModule } from './modules/menus/menus.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SwaggerModule as SwaggerDocModule } from './modules/swagger/swagger.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AccessLogInterceptor } from './common/interceptors/access-log.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SystemModule } from './modules/system/system.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { AuditModule } from './modules/audit/audit.module';
import { ContentsModule } from './modules/contents/contents.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { LogsModule } from './modules/logs/logs.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    // 环境配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // 核心模块
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    MenusModule,
    RolesModule,
    PermissionsModule,
    SwaggerDocModule,
    SystemModule,
    UserRolesModule,
    AuditModule,
    // 内容管理模块
    ContentsModule,
    CategoriesModule,
    TagsModule,
    // 日志模块
    LogsModule,
    RedisModule,
  ],
  providers: [
    // 全局 JWT 认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局角色守卫
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 全局权限守卫
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // 全局限流守卫（仅对标注 @RateLimit 的接口生效）
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    // 全局访问日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: AccessLogInterceptor,
    },
    // 全局响应转换拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // 全局异常过滤器（支持依赖注入）
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
