import { PartialType } from '@nestjs/swagger';
import { CreateCvItemDto } from './create-cv-item.dto';

import { IsNumber, IsOptional } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCvItemDto extends PartialType(CreateCvItemDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  score?: number | null;
}
