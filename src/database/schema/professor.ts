import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const professors = pgTable('professor', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  department: varchar('department', { length: 255 }).notNull(),
  institution: varchar('institution', { length: 255 }).notNull(),
});

export type ProfessorInsert = typeof professors.$inferInsert;
export type ProfessorSelect = typeof professors.$inferSelect;
