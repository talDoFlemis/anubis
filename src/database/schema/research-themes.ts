import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
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

export const researchThemeProfessors = pgTable(
  'research_theme_professors',
  {
    researchThemeId: uuid('research_theme_id')
      .notNull()
      .references(() => researchThemes.id, { onDelete: 'cascade' }),
    professorId: uuid('professor_id')
      .notNull()
      .references(() => professors.userId, { onDelete: 'cascade' }),
  },
  table => [
    primaryKey({ columns: [table.researchThemeId, table.professorId] }),
    index('research_theme_professors_research_theme_id_idx').on(table.researchThemeId),
    index('research_theme_professors_professor_id_idx').on(table.professorId),
  ],
);

export type ResearchThemeInsert = typeof researchThemes.$inferInsert;
export type ResearchThemeSelect = typeof researchThemes.$inferSelect;
export type ResearchThemeProfessorInsert = typeof researchThemeProfessors.$inferInsert;
export type ResearchThemeProfessorSelect = typeof researchThemeProfessors.$inferSelect;
