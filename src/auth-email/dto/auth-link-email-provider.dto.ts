import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthProvidersEnum } from '../../auth/auth-providers.enum';

export class AuthLinkEmailProviderDto {
  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  email?: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @ApiProperty({ enum: AuthProvidersEnum, example: AuthProvidersEnum.google })
  @IsEnum(AuthProvidersEnum)
  provider: AuthProvidersEnum;

  @ApiProperty({ description: 'Proof token from current provider session' })
  @IsOptional()
  @IsNotEmpty()
  providerToken?: string;
}
