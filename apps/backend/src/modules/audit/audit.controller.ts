// src/modules/audit/audit.controller.ts
/**
 * 审计日志控制器
 * 提供审计日志查询接口（仅管理员可访问）
 */
import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { Roles } from '@common/decorators/roles.decorator';

@ApiTags('审计日志')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN') // 仅管理员可访问
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询审计日志列表（分页）' })
  async findAll(@Query() query: QueryAuditLogDto) {
    const { current = 1, size = 20, event, userId, resource, startDate, endDate } = query;

    const skip = (current - 1) * size;
    const take = size;

    const result = await this.auditService.findAll({
      skip,
      take,
      event,
      userId,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return {
      records: result.data,
      current,
      size,
      total: result.total,
    };
  }

  @Get(':id')
  @Roles('ADMIN') // 仅管理员可访问
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '根据ID查询审计日志详情' })
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
