import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app);

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

  await app.listen(port);
}
void bootstrap();
