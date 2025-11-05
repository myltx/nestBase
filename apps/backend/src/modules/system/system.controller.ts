// src/modules/system/system.controller.ts
/**
 * 系统状态控制器
 * 提供服务基础状态信息，用于健康检查和监控
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';

@ApiTags('系统模块')
@Controller('system')
export class SystemController {
  @Get('status')
  @Public()
  @ApiOperation({ summary: '获取系统运行状态' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getStatus() {
    return {
      name: 'NestBase Backend',
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
    };
  }
}
