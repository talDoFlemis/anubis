import { PartialType } from '@nestjs/swagger';
import { CreateCvItemDto } from './create-cv-item.dto';

export class UpdateCvItemDto extends PartialType(CreateCvItemDto) {}
