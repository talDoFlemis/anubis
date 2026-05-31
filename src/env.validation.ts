import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum MailTransport {
  Smtp = 'smtp',
  GoogleOauth = 'google-oauth',
}

export class EnvironmentVariables {
  // Database
  @IsNotEmpty()
  DATABASE_USER!: string;

  @IsNotEmpty()
  DATABASE_PASSWORD!: string;

  @IsNotEmpty()
  DATABASE_NAME!: string;

  @IsNotEmpty()
  DATABASE_HOST!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  DATABASE_PORT!: number;

  // App
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  APP_PORT!: number;

  @IsNotEmpty()
  @IsUrl({
    require_tld: false,
  })
  APP_CORS_ORIGIN!: string;

  @MinLength(32)
  APP_SESSION_SECRET!: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  APP_SECURE_COOKIE: boolean = true;

  @IsOptional()
  APP_PREFIX: string = '';

  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  // Google OAuth (login)
  @IsNotEmpty()
  @IsString()
  GOOGLE_CLIENT_ID!: string;

  @IsNotEmpty()
  @IsString()
  GOOGLE_CLIENT_SECRET!: string;

  // Auth tokens (for email confirmation / forgot password)
  @IsNotEmpty()
  @MinLength(32)
  AUTH_CONFIRM_EMAIL_SECRET!: string;

  @IsOptional()
  @IsString()
  AUTH_CONFIRM_EMAIL_EXPIRES_IN: string = '1d';

  @IsNotEmpty()
  @MinLength(32)
  AUTH_FORGOT_SECRET!: string;

  @IsOptional()
  @IsString()
  AUTH_FORGOT_EXPIRES_IN: string = '30m';

  // Frontend URL (for email links)
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  FRONTEND_URL!: string;

  // Mail transport
  @IsOptional()
  @IsEnum(MailTransport)
  MAIL_TRANSPORT: MailTransport = MailTransport.Smtp;

  // SMTP settings (for dev / mailpit)
  @IsOptional()
  @IsString()
  MAIL_HOST: string = 'localhost';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(65535)
  MAIL_PORT: number = 1025;

  @IsOptional()
  @IsString()
  MAIL_USER: string = '';

  @IsOptional()
  @IsString()
  MAIL_PASSWORD: string = '';

  @IsOptional()
  @IsEmail()
  MAIL_DEFAULT_FROM: string = 'noreply@anubis.local';

  // Google OAuth SMTP (for production)
  @IsOptional()
  @IsString()
  MAIL_GOOGLE_CLIENT_ID: string = '';

  @IsOptional()
  @IsString()
  MAIL_GOOGLE_CLIENT_SECRET: string = '';

  @IsOptional()
  @IsString()
  MAIL_GOOGLE_REFRESH_TOKEN: string = '';

  @IsOptional()
  @IsEmail()
  MAIL_GOOGLE_USER: string = '';

  @IsNotEmpty()
  @MinLength(32)
  SYSTEM_SECRET!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
