import { pgTable, uuid, varchar, pgEnum, timestamp } from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', ['email', 'google']);

export const roleEnum = pgEnum('role', [
  'professor',
  'candidate',
  'mdcc-secretary',
  'post-graduate-coordinator',
]);

export const statusEnum = pgEnum('status', ['active', 'inactive']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  password: varchar('password', { length: 255 }),
  provider: authProviderEnum('provider').notNull().default('email'),
  socialId: varchar('social_id', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  role: roleEnum('role').notNull().default('candidate'),
  status: statusEnum('status').notNull().default('inactive'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
