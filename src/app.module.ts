import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { SessionModule } from './session/session.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'anubis',
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        genReqId: function (req, res) {
          const existingID = req.id ?? req.headers['x-request-id'];
          if (existingID) return existingID;
          const id = randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      {
        // Default: 100 requests per minute per IP
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    AuthGoogleModule,
    SessionModule,
    MailModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AllExceptionsFilter],
})
export class AppModule {}
