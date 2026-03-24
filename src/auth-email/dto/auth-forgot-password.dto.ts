import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'test@example.com', type: String })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  @IsEmail()
  email: string;
}
