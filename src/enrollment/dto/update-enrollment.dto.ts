import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PoscompDto } from './poscomp.dto';
import { UndergradDegreeType } from './undergrad-degree-type.enum';

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ example: 'UFRN', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  undergradUniversity?: string;

  @ApiPropertyOptional({ example: 'Ciência da Computação', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  undergradCourse?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID()
  undergradUniversityId?: string;

  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsOptional()
  @IsUUID()
  undergradCourseId?: string;

  @ApiPropertyOptional({ enum: UndergradDegreeType })
  @IsOptional()
  @IsEnum(UndergradDegreeType)
  undergradDegreeType?: UndergradDegreeType;

  @ApiPropertyOptional({ example: '8.75', maxLength: 5 })
  @IsOptional()
  @MaxLength(5)
  @Matches(/^\d{1,2}(\.\d{1,2})?$/)
  ira?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sigaaCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  declaration?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PoscompDto)
  poscomp?: PoscompDto;

  @ApiPropertyOptional({ description: 'Título do projeto (doutorado)', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  projectTitle?: string;
}
