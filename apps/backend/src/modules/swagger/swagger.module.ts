import { Module } from '@nestjs/common';
import { SwaggerController } from './swagger.controller';
import { SwaggerService } from './swagger.service';

/**
 * Swagger 文档模块
 */
@Module({
  controllers: [SwaggerController],
  providers: [SwaggerService],
  exports: [SwaggerService],
})
export class SwaggerModule {}
