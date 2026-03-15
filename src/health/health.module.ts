import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [TerminusModule, HttpModule, MailModule],
  controllers: [HealthController],
})
export class HealthModule {}
