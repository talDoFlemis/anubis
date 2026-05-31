import { PartialType } from '@nestjs/swagger';
import { CreateCvScoringCategoryDto } from './create-cv-scoring-category.dto';

export class UpdateCvScoringCategoryDto extends PartialType(CreateCvScoringCategoryDto) {}
