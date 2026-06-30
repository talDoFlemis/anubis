import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'; // Adicione uniqueIndex
import { users } from './users';

export const projectConceptEnum = pgEnum('project_evaluation_concept', [
  'FRACO',
  'REGULAR',
  'BOM',
  'OTIMO',
]);

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
    criterion1: projectConceptEnum('criterion_1').notNull(),
    criterion2: projectConceptEnum('criterion_2').notNull(),
    criterion3: projectConceptEnum('criterion_3').notNull(),
    criterion4: projectConceptEnum('criterion_4').notNull(),
    criterion5: projectConceptEnum('criterion_5').notNull(),
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
