import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { SkipTransform } from '@common/decorators/skip-transform.decorator';
import { SwaggerService } from './swagger.service';

/**
 * Swagger 文档控制器
 * 提供 OpenAPI JSON 文档接口，用于 Apifox 等工具导入
 */
@ApiTags('系统')
@Controller('swagger')
export class SwaggerController {
  constructor(private readonly swaggerService: SwaggerService) {}

  /**
   * 获取 OpenAPI JSON 文档
   * 用于 Apifox、Postman 等工具自动导入 API
   */
  @Get('json')
  @Public()
  @SkipTransform()
  @ApiExcludeEndpoint()  // 不在 Swagger UI 中显示此接口，避免递归
  getOpenApiJson() {
    return this.swaggerService.getDocument();
  }

  /**
   * 获取 API 统计信息
   */
  @Get('stats')
  @Public()
  @ApiOperation({ summary: '获取 API 统计信息' })
  @ApiResponse({ status: 200, description: '成功返回统计信息' })
  getStats() {
    return this.swaggerService.getStats();
  }
}
