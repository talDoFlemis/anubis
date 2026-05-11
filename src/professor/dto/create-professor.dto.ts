import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatusEnum } from '../../statuses/statuses.enum';

export class CreateProfessorDto {
  @ApiProperty({ example: 'prof@ufc.br' })
  @IsNotEmpty({ message: 'O Campo email é obrigatório' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  cpf?: string | null;

  @ApiProperty({ example: 'Maria' })
  @IsNotEmpty({ message: 'O Campo firstName é obrigatório' })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Silva' })
  @IsOptional()
  @IsString()
  lastName?: string | null;

  @ApiPropertyOptional({ example: 'active', enum: StatusEnum })
  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;

  @ApiProperty({ example: 'Departamento de Computacao' })
  @IsNotEmpty()
  @IsString()
  department!: string;

  @ApiProperty({ example: 'UFC' })
  @IsNotEmpty({ message: 'O Campo institution é obrigatório' })
  @IsString()
  institution!: string;
}
