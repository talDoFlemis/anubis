import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
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
}
