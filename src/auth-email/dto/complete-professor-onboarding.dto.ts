import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CompleteProfessorOnboardingDto {
  @ApiProperty({ description: 'The onboarding hash sent to the professor email' })
  @IsNotEmpty()
  hash!: string;

  @ApiProperty({ description: 'The new password for the professor' })
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
