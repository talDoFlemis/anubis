import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  uniqueIndex,
  integer,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const authProviderEnum = pgEnum('auth_provider', ['email', 'google']);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProviderEnum('provider').notNull().default('email'),
    providerId: varchar('social_id', { length: 255 }).notNull(),
    attachedEmail: varchar('attached_email', { length: 255 }),
    attachedEmailVerifiedAt: timestamp('attached_email_verified_at', {
      withTimezone: true,
    }),
    attachedEmailVerificationTokenVersion: integer(
      'attached_email_verification_token_version',
    )
      .notNull()
      .default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    providerSocialUnique: uniqueIndex('accounts_provider_social_unique').on(
      table.provider,
      table.providerId,
    ),
  }),
);

export type AccountInsert = typeof accounts.$inferInsert;
export type AccountSelect = typeof accounts.$inferSelect;
