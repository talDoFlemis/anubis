import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { enrollments } from './enrollments';
import { users } from './users';

export const scoreTypeEnum = pgEnum('score_type', ['cv_score', 'ira', 'final']);

export const scoreAdjustments = pgTable(
  'score_adjustments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    adjustedBy: uuid('adjusted_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scoreType: scoreTypeEnum('score_type').notNull(),
    originalValue: numeric('original_value', { precision: 7, scale: 2 }).notNull(),
    adjustedValue: numeric('adjusted_value', { precision: 7, scale: 2 }).notNull(),
    justification: text('justification').notNull(),
    isLocked: boolean('is_locked').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex('score_adjustments_enrollment_type_unique').on(table.enrollmentId, table.scoreType),
  ],
);

export type ScoreAdjustmentInsert = typeof scoreAdjustments.$inferInsert;
export type ScoreAdjustmentSelect = typeof scoreAdjustments.$inferSelect;
