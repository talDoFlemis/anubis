import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeCpf } from '../../common/utils/normalize-cpf';
import { IsCpf } from '../../common/validators/is-cpf.validator';

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
  @Transform(({ value }) => normalizeCpf(value))
  @IsCpf()
  cpf: string;

  @ApiProperty({ example: 'UFRN' })
  @IsNotEmpty()
  universityOfOrigin: string;
}
