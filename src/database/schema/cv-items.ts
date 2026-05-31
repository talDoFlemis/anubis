import { integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { cvScoringCategories } from './cv-scoring';
import { enrollments } from './enrollments';
import { files } from './files';

export const cvItems = pgTable('cv_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id')
    .notNull()
    .references(() => enrollments.id, { onDelete: 'cascade' }),
  scoringCategoryId: uuid('scoring_category_id')
    .notNull()
    .references(() => cvScoringCategories.id, { onDelete: 'restrict' }),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  proofFileId: uuid('proof_file_id').references(() => files.id, {
    onDelete: 'set null',
  }),
  score: numeric('score', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CvItemInsert = typeof cvItems.$inferInsert;
export type CvItemSelect = typeof cvItems.$inferSelect;
