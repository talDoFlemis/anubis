import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteSecretaryDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsNotEmpty({ message: 'O campo nome é obrigatório' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'secretaria@ufc.br' })
  @IsNotEmpty({ message: 'O campo email é obrigatório' })
  @IsEmail({}, { message: 'O campo email deve ser um email válido' })
  email!: string;
}
