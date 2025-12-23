import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * 更新项目 DTO
 * 所有字段都是可选的
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiPropertyOptional({ description: '是否精选' })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
