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
import { QueryAccessLogDto, QueryLoginLogDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '@common/guards';
import { Roles } from '@common/decorators';

@ApiTags('日志管理')
@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('access')
  @Roles('ADMIN')
  @ApiOperation({ summary: '查询访问日志列表（仅管理员）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAllAccessLogs(@Query() queryDto: QueryAccessLogDto) {
    return this.logsService.findAllAccessLogs(queryDto);
  }

  @Get('access/stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取访问日志统计信息（仅管理员）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getAccessLogStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.getAccessLogStats(startDate, endDate);
  }

  @Get('login')
  @Roles('ADMIN')
  @ApiOperation({ summary: '查询登录日志列表（仅管理员）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  findAllLoginLogs(@Query() queryDto: QueryLoginLogDto) {
    return this.logsService.findAllLoginLogs(queryDto);
  }

  @Get('login/stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: '获取登录日志统计信息（仅管理员）' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 403, description: '权限不足' })
  getLoginLogStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.logsService.getLoginLogStats(startDate, endDate);
  }
}
