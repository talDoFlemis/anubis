import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, Matches } from 'class-validator';

export class CompleteCandidateOnboardingDto {
  @ApiProperty({ example: 'Jonathan' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Galindo' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '12345678901' })
  @Transform(({ value }) => (value as string).replace(/\D/g, '').trim())
  @Matches(/^\d{11}$/)
  cpf: string;

  @ApiProperty({ example: 'UFRN' })
  @IsNotEmpty()
  universityOfOrigin: string;
}
