import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizeCpf } from '../../common/utils/normalize-cpf';
import { IsCpf } from '../../common/validators/is-cpf.validator';

export class AuthRegisterDto {
  @ApiProperty({ example: 'test@example.com', type: String })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  @IsEmail()
  email!: string;

  @ApiProperty()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: '12345678901' })
  @Transform(({ value }) => normalizeCpf(value))
  @IsCpf()
  cpf!: string;

  @ApiProperty({ example: 'UFRN' })
  @IsNotEmpty()
  universityOfOrigin!: string;

  @ApiProperty({ example: '8.75', maxLength: 5 })
  @IsNotEmpty()
  @MaxLength(5)
  @Matches(/^\d{1,2}(\.\d{1,2})?$/)
  ira!: string;
}
