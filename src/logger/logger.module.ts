import { Module } from '@nestjs/common';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('Anubis', {
              colors: true,
              prettyPrint: true,
              processId: true,
              appName: true,
            }),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  exports: [WinstonModule]
})
export class LoggerModule {}
