import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * 更新项目 DTO
 * 所有字段都是可选的
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
