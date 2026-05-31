import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const universities = pgTable('universities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 50 }),
  state: varchar('state', { length: 2 }),
  city: varchar('city', { length: 255 }),
  isManual: boolean('is_manual').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 500 }).notNull(),
  universityId: uuid('university_id').references(() => universities.id, { onDelete: 'cascade' }),
  isManual: boolean('is_manual').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UniversityInsert = typeof universities.$inferInsert;
export type UniversitySelect = typeof universities.$inferSelect;
export type CourseInsert = typeof courses.$inferInsert;
export type CourseSelect = typeof courses.$inferSelect;
