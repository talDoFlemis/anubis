import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { IsCpf } from 'src/common/validators/is-cpf.validator';
import { normalizeCpf } from '../../common/utils/normalize-cpf';

export class CompleteCandidateOnboardingDto {
  @ApiProperty({ example: 'Jonathan' })
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Galindo' })
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '12345678901' })
  @Transform(({ value }) => normalizeCpf(value))
  @IsCpf()
  cpf!: string;

  @ApiPropertyOptional({ example: 780, minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  poscomp?: number;
}
