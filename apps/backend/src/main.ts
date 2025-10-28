// src/main.ts
/**
 * 应用主入口
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { SwaggerService } from './modules/swagger/swagger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // 启用 CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 设置全局 API 前缀
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动剥离未在 DTO 中定义的属性
      forbidNonWhitelisted: false, // 不报错，只是忽略额外的字段
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 配置 Swagger 文档
  const document = setupSwagger(app);

  // 将文档注入到 SwaggerService
  const swaggerService = app.get(SwaggerService);
  swaggerService.setDocument(document);

  // 启动应用
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const swaggerPath = configService.get('SWAGGER_PATH', 'api-docs');

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 NestBase 后端服务框架已成功启动！                         ║
║                                                               ║
║   📍 服务地址: http://localhost:${port}                          ║
║   📚 API 文档: http://localhost:${port}/${swaggerPath}              ║
║   📄 OpenAPI JSON: http://localhost:${port}/api/swagger/json   ║
║   📊 API 统计: http://localhost:${port}/api/swagger/stats      ║
║   🔧 环境模式: ${configService.get('NODE_ENV', 'development')}                              ║
║                                                               ║
║   技术栈: NestJS + Supabase + Prisma + JWT                   ║
║                                                               ║
║   💡 Apifox 导入: 使用 OpenAPI JSON 链接自动导入              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
