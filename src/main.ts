import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const configService = app.get(ConfigService);
  const logger = app.get<Logger>(WINSTON_MODULE_PROVIDER);

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
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
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

  logger.info('Starting application', {
    port: port,
  });

  await app.listen(port);
}
void bootstrap();
