import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { ResearchThemeReference } from '../../common/types/research-theme-reference';
import { professors } from './professor';

export const researchThemeLevelEnum = pgEnum('research_theme_level', ['masters', 'doctoral']);

export const researchThemes = pgTable(
  'research_themes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    professorId: uuid('professor_id')
      .notNull()
      .references(() => professors.userId, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    vacancies: integer('vacancies').notNull(),
    level: researchThemeLevelEnum('level').notNull(),
    references: jsonb('references')
      .$type<ResearchThemeReference[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index('research_themes_level_idx').on(table.level),
    index('research_themes_professor_id_idx').on(table.professorId),
  ],
);

export type ResearchThemeInsert = typeof researchThemes.$inferInsert;
export type ResearchThemeSelect = typeof researchThemes.$inferSelect;
