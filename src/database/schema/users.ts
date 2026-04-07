import { pgTable, uuid, varchar, pgEnum, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', [
  'professor',
  'candidate',
  'mdcc-secretary',
  'post-graduate-coordinator',
  'post-graduate-vice-coordinator',
]);

export const statusEnum = pgEnum('status', ['active', 'inactive']);
export const authProviderEnum = pgEnum('auth_provider', ['email', 'google']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authProvider: authProviderEnum('auth_provider').notNull().default('email'),
  providerSubject: varchar('provider_subject', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  cpf: varchar('cpf', { length: 11 }).unique(),
  password: varchar('password', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  role: roleEnum('role').notNull().default('candidate'),
  status: statusEnum('status').notNull().default('inactive'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(true),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  bootstrapPasswordExpiresAt: timestamp('bootstrap_password_expires_at', {
    withTimezone: true,
  }),
  confirmEmailTokenVersion: integer('confirm_email_token_version').notNull().default(0),
  forgotPasswordTokenVersion: integer('forgot_password_token_version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;
