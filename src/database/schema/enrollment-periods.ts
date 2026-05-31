import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const enrollmentPeriodStatusEnum = pgEnum('enrollment_period_status', [
  'scheduled',
  'open',
  'closed',
]);

export const enrollmentLevelEnum = pgEnum('enrollment_level', ['masters', 'doctoral']);

export const enrollmentPeriods = pgTable('enrollment_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  semester: varchar('semester', { length: 10 }).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: enrollmentPeriodStatusEnum('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type EnrollmentPeriodInsert = typeof enrollmentPeriods.$inferInsert;
export type EnrollmentPeriodSelect = typeof enrollmentPeriods.$inferSelect;
