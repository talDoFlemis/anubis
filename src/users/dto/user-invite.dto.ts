import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';
import { RoleEnum } from 'src/roles/roles.enum';

export class UserInviteDto {
  @ApiProperty({ example: 'professor@example.com' })
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ada' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Lovelace' })
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '12345678901' })
  @Transform(({ value }) => (value as string).replace(/\D/g, '').trim())
  @Matches(/^\d{11}$/)
  cpf: string;

  @ApiProperty({ enum: RoleEnum })
  role: RoleEnum;
}
