import type { PeriodStatus } from '../../constants/enrollment-status';
import type { EnrollmentPeriod } from '../../domain/enrollment-period';

export interface CreateEnrollmentPeriodData {
  name: string;
  semester: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
}

export interface UpdateEnrollmentPeriodData {
  name?: string;
  semester?: string;
  startDate?: Date;
  endDate?: Date;
  status?: PeriodStatus;
  updatedAt: Date;
}

export interface OverlappingPeriodInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface SyncStatusesResult {
  opened: { id: string }[];
  closed: { id: string }[];
  skipped: { id: string }[];
}

export abstract class EnrollmentPeriodRepository {
  abstract findAll(): Promise<EnrollmentPeriod[]>;

  abstract findById(id: string): Promise<EnrollmentPeriod | null>;

  abstract findByStatus(status: PeriodStatus): Promise<EnrollmentPeriod[]>;

  abstract findOverlapping(startDate: Date, endDate: Date): Promise<OverlappingPeriodInfo[]>;

  abstract create(data: CreateEnrollmentPeriodData): Promise<EnrollmentPeriod>;

  abstract update(id: string, data: UpdateEnrollmentPeriodData): Promise<EnrollmentPeriod | null>;

  abstract remove(id: string): Promise<void>;

  abstract hasEnrollments(periodId: string): Promise<boolean>;

  abstract syncStatuses(now: Date): Promise<SyncStatusesResult>;
}
