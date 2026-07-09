import { sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const universities = pgTable(
  'universities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 500 }).notNull(),
    abbreviation: varchar('abbreviation', { length: 50 }),
    state: varchar('state', { length: 2 }),
    city: varchar('city', { length: 255 }),
    isManual: boolean('is_manual').notNull().default(false),
    mecGrade: integer('mec_grade'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    searchVector: tsvector('search_vector').generatedAlwaysAs(
      () => sql`to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(abbreviation, ''))`,
    ),
  },
  table => [index('universities_search_vector_gin_idx').using('gin', table.searchVector)],
);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 500 }).notNull(),
    universityId: uuid('university_id').references(() => universities.id, { onDelete: 'cascade' }),
    isManual: boolean('is_manual').notNull().default(false),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    searchVector: tsvector('search_vector').generatedAlwaysAs(
      () => sql`to_tsvector('simple', coalesce(name, ''))`,
    ),
  },
  table => [index('courses_search_vector_gin_idx').using('gin', table.searchVector)],
);

export type UniversityInsert = typeof universities.$inferInsert;
export type UniversitySelect = typeof universities.$inferSelect;
export type CourseInsert = typeof courses.$inferInsert;
export type CourseSelect = typeof courses.$inferSelect;
