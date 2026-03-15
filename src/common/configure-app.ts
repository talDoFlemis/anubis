import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import helmet from 'helmet';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

/**
 * Applies the standard middleware, pipes, guards, and interceptors to a
 * NestJS application instance. Called from both main.ts and E2E tests so the
 * test environment mirrors production exactly.
 */
export async function configureApp(app: INestApplication): Promise<void> {
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalFilters(app.get(AllExceptionsFilter));

  app.use(helmet());

  app.enableCors({
    origin: configService.getOrThrow<string>('APP_CORS_ORIGIN'),
    credentials: true,
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.getOrThrow('APP_PREFIX'));

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const PgSession = connectPgSimple(session);
  const sessionPool = new Pool({
    host: configService.getOrThrow('DATABASE_HOST'),
    port: configService.getOrThrow<number>('DATABASE_PORT'),
    user: configService.getOrThrow('DATABASE_USER'),
    password: configService.getOrThrow('DATABASE_PASSWORD'),
    database: configService.getOrThrow('DATABASE_NAME'),
  });

  app.use(
    session({
      store: new PgSession({
        pool: sessionPool,
        tableName: 'session',
        createTableIfMissing: false,
      }),
      secret: configService.getOrThrow('APP_SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: configService.getOrThrow<boolean>('APP_SECURE_COOKIE'),
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
}
