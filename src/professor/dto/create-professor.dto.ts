import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../statuses/statuses.enum';
import { IsCpf } from '../../common/validators/is-cpf.validator';
import { normalizeCpf } from '../../common/utils/normalize-cpf';

export class CreateProfessorDto {
  @ApiProperty({ example: 'prof@ufc.br' })
  @IsNotEmpty({ message: 'O Campo email é obrigatório' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Senha@1234', minLength: 8 })
  @IsOptional()
  @MinLength(8)
  password?: string | null;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @Transform(({ value }) => normalizeCpf(value))
  @IsCpf()
  cpf?: string | null;

  @ApiProperty({ example: 'Maria' })
  @IsNotEmpty({ message: 'O Campo firstName é obrigatório' })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Silva' })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiPropertyOptional({ example: 'professor', enum: RoleEnum })
  @IsOptional()
  @IsEnum(RoleEnum)
  role?: RoleEnum;

  @ApiPropertyOptional({ example: 'active', enum: StatusEnum })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  @ApiPropertyOptional({ example: 'email', enum: AuthProvidersEnum })
  @IsOptional()
  @IsEnum(AuthProvidersEnum)
  authProvider?: AuthProvidersEnum;

  @ApiPropertyOptional({ example: 'google-subject-123' })
  @IsOptional()
  @IsString()
  providerSubject?: string | null;

  @ApiProperty({ example: 'Departamento de Computacao' })
  @IsNotEmpty()
  @IsString()
  department!: string;

  @ApiProperty({ example: 'UFC' })
  @IsNotEmpty({ message: 'O Campo institution é obrigatório' })
  @IsString()
  institution!: string;
}
