import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteGoogleOnboardingDto {
  @ApiProperty({
    description: 'Onboarding hash received via invitation email',
  })
  @IsNotEmpty({ message: 'O hash de confirmacao é obrigatório' })
  @IsString()
  hash!: string;

  @ApiProperty({
    description: 'Google ID token obtained from OAuth flow',
  })
  @IsNotEmpty({ message: 'O token do Google é obrigatório' })
  @IsString()
  idToken!: string;
}
