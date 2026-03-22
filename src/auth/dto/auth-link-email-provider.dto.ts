import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthProvidersEnum } from '../auth-providers.enum';

export class AuthLinkEmailProviderDto {
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

  @ApiPropertyOptional({
    description:
      'ID of the owned email alias to link when the user has multiple verified addresses',
    example: 'b7c2f7c0-7b5f-4b61-9b74-2fc5f47a8f8e',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ownedEmailAccountId?: string;
}
