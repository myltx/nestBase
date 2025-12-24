// src/modules/logs/logs.controller.ts
/**
 * 日志控制器
 * 处理日志相关的 HTTP 请求
 */
import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { QueryLogDto } from './dto/query-log.dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';

@ApiTags('日志管理')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: '查询日志列表（支持访问/登录日志）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAll(@Query() queryDto: QueryLogDto) {
    return this.logsService.findAll(queryDto);
  }

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取日志统计信息（支持访问/登录日志）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getStats(
    @Query('type') type: 'ACCESS' | 'LOGIN' = 'ACCESS',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.getStats(type, startDate, endDate);
  }
}
