// src/config/swagger.config.ts
/**
 * Swagger 文档配置
 */

import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle(configService.get<string>('SWAGGER_TITLE', 'NestBase API Documentation'))
    .setDescription(
      configService.get<string>(
        'SWAGGER_DESCRIPTION',
        '基于 NestJS + Supabase + Prisma 的后端服务框架',
      ),
    )
    .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0'))
    .addServer(`http://localhost:${configService.get('PORT', 3000)}`, '本地开发环境')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入 JWT Token',
      },
      'access-token',
    )
    .addTag('认证模块', '用户认证相关接口')
    .addTag('用户模块', '用户管理相关接口')
    .addTag('项目管理', '项目展示相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 设置 Swagger UI
  SwaggerModule.setup(
    configService.get<string>('SWAGGER_PATH', 'api-docs'),
    app,
    document,
    {
      customSiteTitle: 'NestBase API',
      customCss: `
        .swagger-ui .topbar { background-color: #2563eb; }
        .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="60" fill="white">🚀</text></svg>'); }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    },
  );

  console.log(
    `📚 Swagger 文档已启动: http://localhost:${configService.get('PORT', 3000)}/${configService.get('SWAGGER_PATH', 'api-docs')}`,
  );
  console.log(
    `📄 OpenAPI JSON: http://localhost:${configService.get('PORT', 3000)}/${configService.get('SWAGGER_PATH', 'api-docs')}-json`,
  );

  // 返回 document 供其他地方使用
  return document;
}
