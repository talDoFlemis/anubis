export const PERIOD_STATUS = {
  SCHEDULED: 'scheduled',
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export type PeriodStatus = (typeof PERIOD_STATUS)[keyof typeof PERIOD_STATUS];

export const ENROLLMENT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];
