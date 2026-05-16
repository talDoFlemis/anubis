import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MailModule } from 'src/mail/mail.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule, MailModule],
  controllers: [HealthController],
})
export class HealthModule {}
