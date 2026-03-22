import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CompleteCandidateOnboardingDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '12345678901' })
  @Transform(({ value }) => (value as string).replace(/\D/g, '').trim())
  @Matches(/^\d{11}$/)
  cpf: string;

  @ApiProperty({ example: 'UFRN' })
  @IsNotEmpty()
  universityOfOrigin: string;

  @ApiPropertyOptional({ example: '8.75', maxLength: 5 })
  @IsOptional()
  @MaxLength(5)
  @Matches(/^\d{1,2}(\.\d{1,2})?$/)
  ira?: string;

  @ApiPropertyOptional({ example: 780, minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  poscomp?: number;
}
