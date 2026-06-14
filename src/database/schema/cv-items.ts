import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
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
  classification: varchar('classification', { length: 50 }),
  isComplete: boolean('is_complete').default(false),
  isResumo: boolean('is_resumo').default(false),
  isPeriodico: boolean('is_periodico').default(false),
  isAutorPrincipal: boolean('is_autor_principal').default(false),
  isDissertacao: boolean('is_dissertacao').default(false),
  isEncontroIc: boolean('is_encontro_ic').default(false),
  isInArea: boolean('is_in_area').default(false),
  docenciaType: varchar('docencia_type', { length: 50 }),
  eventoType: varchar('evento_type', { length: 50 }),
  isVerified: varchar('is_verified', { length: 50 }).notNull().default('pending'),
  correctedClassification: varchar('corrected_classification', { length: 50 }),
  verificationComment: text('verification_comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CvItemInsert = typeof cvItems.$inferInsert;
export type CvItemSelect = typeof cvItems.$inferSelect;
