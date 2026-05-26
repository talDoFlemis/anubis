import { PartialType } from '@nestjs/swagger';
import { CreateResearchThemeDto } from './create-research-theme.dto';

export class UpdateResearchThemeDto extends PartialType(CreateResearchThemeDto) {}
