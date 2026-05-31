import { integer, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { enrollmentLevelEnum, enrollmentPeriods } from './enrollment-periods';

export const cvScoringCategories = pgTable('cv_scoring_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentPeriodId: uuid('enrollment_period_id')
    .notNull()
    .references(() => enrollmentPeriods.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  pointsPerItem: numeric('points_per_item', {
    precision: 5,
    scale: 2,
  }).notNull(),
  maxPoints: numeric('max_points', { precision: 5, scale: 2 }).notNull(),
  level: enrollmentLevelEnum('level').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CvScoringCategoryInsert = typeof cvScoringCategories.$inferInsert;
export type CvScoringCategorySelect = typeof cvScoringCategories.$inferSelect;
