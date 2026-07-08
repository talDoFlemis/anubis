import { integer, numeric, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { researchThemes } from './research-themes';
import { users } from './users';

export const stageEnum = pgEnum('stage', ['mestrado', 'doutorado']);

export const classifications = pgTable('classifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  candidateId: uuid('candidate_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  researchThemeId: uuid('research_theme_id')
    .notNull()
    .references(() => researchThemes.id, { onDelete: 'set null' }),
  ira: numeric('ira', { precision: 5, scale: 2 }).notNull().default('0'),
  interviewScore: numeric('interview_score', { precision: 5, scale: 2 }).notNull(),
  cvScore: numeric('cv_score', { precision: 5, scale: 2 }).notNull(),
  projectScore: numeric('project_score', { precision: 5, scale: 2 }),
  finalScore: numeric('final_score', { precision: 5, scale: 2 }).notNull(),
  rank: integer('rank').notNull(),
  stage: stageEnum('stage').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ClassificationInsert = typeof classifications.$inferInsert;
export type ClassificationSelect = typeof classifications.$inferSelect;
