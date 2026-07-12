import { numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const projectEvaluations = pgTable(
  'project_evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    evaluatorId: uuid('evaluator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    criterion1: numeric('criterion_1', { precision: 4, scale: 2 }).notNull(),
    criterion2: numeric('criterion_2', { precision: 4, scale: 2 }).notNull(),
    criterion3: numeric('criterion_3', { precision: 4, scale: 2 }).notNull(),
    criterion4: numeric('criterion_4', { precision: 4, scale: 2 }).notNull(),
    criterion5: numeric('criterion_5', { precision: 4, scale: 2 }).notNull(),
    observations: text('observations'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    evaluatorCandidateIdx: uniqueIndex('uidx_evaluator_candidate_project').on(
      table.evaluatorId,
      table.candidateId,
    ),
  }),
);

export type ProjectEvaluationInsert = typeof projectEvaluations.$inferInsert;
export type ProjectEvaluationSelect = typeof projectEvaluations.$inferSelect;
