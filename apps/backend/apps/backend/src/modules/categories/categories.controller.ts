import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('分类管理')
@Controller('categories')
export class CategoriesController {}
