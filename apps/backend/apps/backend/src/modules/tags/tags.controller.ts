import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('标签管理')
@Controller('tags')
export class TagsController {}
