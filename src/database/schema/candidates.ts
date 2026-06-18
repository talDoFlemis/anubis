import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const candidates = pgTable('candidates', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  poscomp: integer('poscomp'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CandidateInsert = typeof candidates.$inferInsert;
export type CandidateSelect = typeof candidates.$inferSelect;
