import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AdminModule } from './admin/admin.module';
import { configureApp } from './common/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  await configureApp(app);

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  const config = new DocumentBuilder()
    .setTitle('Anubis')
    .setDescription('MDCC Masters and Doctors Selection')
    .setVersion('0.420.69')
    .addTag('anubis')
    .addCookieAuth('connect.sid')
    .build();
  const document = () => SwaggerModule.createDocument(app, config);

  if (configService.getOrThrow('NODE_ENV') !== 'production') {
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
