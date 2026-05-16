import { integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const candidates = pgTable('candidates', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  universityOfOrigin: varchar('university_of_origin', {
    length: 255,
  }).notNull(),
  ira: numeric('ira', { precision: 5, scale: 2 }),
  poscomp: integer('poscomp'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CandidateInsert = typeof candidates.$inferInsert;
export type CandidateSelect = typeof candidates.$inferSelect;
