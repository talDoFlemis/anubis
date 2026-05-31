import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnrollmentPeriodService } from './enrollment-period.service';

@Injectable()
export class EnrollmentPeriodScheduler {
  constructor(private readonly enrollmentPeriodService: EnrollmentPeriodService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    await this.enrollmentPeriodService.syncStatuses();
  }
}
