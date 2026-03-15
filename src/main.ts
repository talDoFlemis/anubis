import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ConfigService } from '@nestjs/config';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AdminModule } from './admin/admin.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.useGlobalInterceptors(new LoggerErrorInterceptor());

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

  // PostgreSQL-backed session store
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

  const config = new DocumentBuilder()
    .setTitle('Anubis')
    .setDescription('MDCC Masters and Doctors Selection')
    .setVersion('0.420.69')
    .addTag('anubis')
    .addCookieAuth('connect.sid')
    .build();
  const document = () => SwaggerModule.createDocument(app, config);

  if (configService.getOrThrow('NODE_ENV') != 'production') {
    app.use(
      '/reference',
      apiReference({
        content: document,
      }),
    );
  }
  const port = configService.getOrThrow<string>('APP_PORT');

  logger.log('Starting application', {
    port: port,
  });

  const adminApp = await NestFactory.create(AdminModule, { bufferLogs: true });
  const adminConfigService = adminApp.get(ConfigService);
  const adminPort = adminConfigService.getOrThrow<string>('ADMIN_PORT');
  adminApp.useLogger(logger);
  adminApp.enableShutdownHooks();
  adminApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port);
  await adminApp.listen(adminPort);
}
void bootstrap();
