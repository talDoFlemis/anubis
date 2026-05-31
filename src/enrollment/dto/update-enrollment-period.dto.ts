import { PartialType } from '@nestjs/swagger';
import { CreateEnrollmentPeriodDto } from './create-enrollment-period.dto';

export class UpdateEnrollmentPeriodDto extends PartialType(CreateEnrollmentPeriodDto) {}
