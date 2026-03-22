import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from '../env.validation';
import { SystemController } from './system.controller';
import { SystemTokenGuard } from './guards/system-token.guard';
import { DatabaseModule } from '../database/database.module';
import { LoggingModule } from '../common/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggingModule,
    DatabaseModule,
  ],
  controllers: [SystemController],
  providers: [SystemTokenGuard],
})
export class SystemModule {}
