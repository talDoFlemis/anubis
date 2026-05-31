import {
  boolean,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { enrollmentLevelEnum, enrollmentPeriods } from './enrollment-periods';
import { users } from './users';

export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'draft',
  'submitted',
  'closed',
  'cancelled',
]);

export interface PoscompData {
  hasPoscomp: boolean;
  year?: number;
  mathScore?: number;
  fundamentalsScore?: number;
  technologyScore?: number;
  receiptFileId?: string;
}

export interface MastersDegreeData {
  university: string;
  graduateProgram: string;
  ira: number;
  isPrimary: boolean;
}

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    enrollmentPeriodId: uuid('enrollment_period_id')
      .notNull()
      .references(() => enrollmentPeriods.id, { onDelete: 'restrict' }),
    level: enrollmentLevelEnum('level').notNull(),
    status: enrollmentStatusEnum('status').notNull().default('draft'),
    phone: varchar('phone', { length: 20 }),
    justification: text('justification'),
    sigaaCode: varchar('sigaa_code', { length: 50 }),
    sigaaReceiptFileId: varchar('sigaa_receipt_file_id', { length: 255 }),
    declaration: boolean('declaration').default(false),
    poscomp: jsonb('poscomp').$type<PoscompData | null>(),
    mastersDegrees: jsonb('masters_degrees').$type<MastersDegreeData[] | null>(),
    scoreDraft: numeric('score_draft', { precision: 7, scale: 2 }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex('enrollments_candidate_period_unique').on(
      table.candidateId,
      table.enrollmentPeriodId,
    ),
  ],
);

export type EnrollmentInsert = typeof enrollments.$inferInsert;
export type EnrollmentSelect = typeof enrollments.$inferSelect;
