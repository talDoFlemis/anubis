import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            name: 'anubis',
            level: isProduction ? 'info' : 'debug',
            genReqId: function (req, res) {
              const existing = req.id ?? req.headers['x-request-id'];
              if (existing) return existing;
              const id = randomUUID();
              res.setHeader('X-Request-Id', id);
              return id;
            },
            transport: isProduction ? undefined : { target: 'pino-pretty' },
          },
        };
      },
    }),
  ],
  providers: [AllExceptionsFilter],
  exports: [LoggerModule, AllExceptionsFilter],
})
export class LoggingModule {}
