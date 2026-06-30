import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const conceptEnum = pgEnum('evaluation_concept', ['FRACO', 'REGULAR', 'BOM', 'OTIMO']);

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

    decisionMaking: conceptEnum('decision_making').notNull(),
    problemAnalysis: conceptEnum('problem_analysis').notNull(),
    oralCommunication: conceptEnum('oral_communication').notNull(),
    researchWork: conceptEnum('research_work').notNull(),
    technicalKnowledge: conceptEnum('technical_knowledge').notNull(),

    observations: text('observations'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },

  table => [
    uniqueIndex('uidx_evaluator_candidate_interview').on(table.evaluatorId, table.candidateId),
  ],
);

export type InterviewEvaluationInsert = typeof interviewEvaluations.$inferInsert;
export type InterviewEvaluationSelect = typeof interviewEvaluations.$inferSelect;
