import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthResendProfessorOnboardingDto {
  @ApiProperty({ example: 'professor@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
