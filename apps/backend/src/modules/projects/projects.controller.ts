import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  QueryProjectDto,
} from './dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';

/**
 * 项目管理控制器
 */
@ApiTags('项目管理')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * 创建项目（仅管理员）
   */
  @Post()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建项目' })
  @ApiResponse({ status: 201, description: '项目创建成功' })
  @ApiResponse({ status: 400, description: '创建失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  /**
   * 获取项目列表（公开，支持分页、搜索、筛选）
   */
  @Get()
  @Public()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findAll(@Query() queryDto: QueryProjectDto) {
    return this.projectsService.findAll(queryDto);
  }

  /**
   * 获取所有精选项目（公开，不分页）
   */
  @Get('featured')
  @Public()
  @ApiOperation({ summary: '获取所有精选项目' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findFeatured() {
    return this.projectsService.findFeatured();
  }

  /**
   * 获取所有技术栈（公开）
   */
  @Get('tech-stack')
  @Public()
  @ApiOperation({ summary: '获取所有技术栈' })
  @ApiResponse({ status: 200, description: '查询成功' })
  getTechStack() {
    return this.projectsService.getTechStack();
  }

  /**
   * 获取单个项目（公开）
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取单个项目' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  /**
   * 更新项目（仅管理员）
   */
  @Patch(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新项目' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '更新失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  /**
   * 切换项目精选状态（仅管理员）
   */
  @Patch(':id/toggle-featured')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '切换项目精选状态' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  toggleFeatured(@Param('id') id: string) {
    return this.projectsService.toggleFeatured(id);
  }

  /**
   * 删除项目（仅管理员）
   */
  @Delete(':id')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除项目' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 400, description: '删除失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
