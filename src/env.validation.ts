import { plainToInstance } from 'class-transformer';
import {
  IsNumber,
  validateSync,
  IsNotEmpty,
  Min,
  Max,
  IsUrl,
  IsEnum,
  IsOptional,
  MinLength,
  IsBoolean,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
}

export class EnvironmentVariables {
  @IsNotEmpty()
  DATABASE_USER: string;

  @IsNotEmpty()
  DATABASE_PASSWORD: string;

  @IsNotEmpty()
  DATABASE_NAME: string;

  @IsNotEmpty()
  DATABASE_HOST: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  DATABASE_PORT: number;

  @IsNumber()
  @Min(0)
  @Max(65535)
  APP_PORT: number;

  @IsNotEmpty()
  @IsUrl({
    require_tld: false,
  })
  APP_CORS_ORIGIN: string;

  @MinLength(32)
  APP_SESSION_SECRET: string;

  @IsOptional()
  @IsBoolean()
  APP_SECURE_COOKIE: boolean = false;

  @IsOptional()
  APP_PREFIX: string = '';

  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
