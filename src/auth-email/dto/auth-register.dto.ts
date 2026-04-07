import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthRegisterDto {
  @ApiProperty({ example: 'test@example.com', type: String })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6)
  @MaxLength(72)
  password: string;

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
}
