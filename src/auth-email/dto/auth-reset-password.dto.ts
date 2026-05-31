import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class AuthResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  hash!: string;

  @ApiProperty()
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
