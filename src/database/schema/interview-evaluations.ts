import { numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const interviewEvaluations = pgTable(
  'interview_evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    evaluatorId: uuid('evaluator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    decisionMaking: numeric('decision_making', { precision: 4, scale: 2 }).notNull(),
    problemAnalysis: numeric('problem_analysis', { precision: 4, scale: 2 }).notNull(),
    oralCommunication: numeric('oral_communication', { precision: 4, scale: 2 }).notNull(),
    researchWork: numeric('research_work', { precision: 4, scale: 2 }).notNull(),
    technicalKnowledge: numeric('technical_knowledge', { precision: 4, scale: 2 }).notNull(),

    observations: text('observations'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },

  table => [
    uniqueIndex('uidx_evaluator_candidate_interview').on(table.evaluatorId, table.candidateId),
  ],
);

export type InterviewEvaluationInsert = typeof interviewEvaluations.$inferInsert;
export type InterviewEvaluationSelect = typeof interviewEvaluations.$inferSelect;
