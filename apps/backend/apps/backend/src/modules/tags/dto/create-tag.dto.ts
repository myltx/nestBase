import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: '标签名称', example: 'NestJS' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL标识符', example: 'nestjs' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
