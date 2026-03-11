import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
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

  app.use(
    session({
      secret: configService.getOrThrow('APP_SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: configService.getOrThrow('APP_SECURE_COOKIE') },
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
bootstrap();
