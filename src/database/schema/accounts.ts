import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  uniqueIndex,
  integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const authProviderEnum = pgEnum('auth_provider', ['email', 'google']);
export const accountEntryTypeEnum = pgEnum('account_entry_type', [
  'provider_link',
  'attached_email',
]);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entryType: accountEntryTypeEnum('entry_type')
      .notNull()
      .default('provider_link'),
    provider: authProviderEnum('provider').notNull().default('email'),
    socialId: varchar('social_id', { length: 255 }),
    attachedEmail: varchar('attached_email', { length: 255 }),
    attachedEmailNormalized: varchar('attached_email_normalized', {
      length: 255,
    }),
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
    userProviderUnique: uniqueIndex('accounts_user_provider_unique')
      .on(table.userId, table.provider)
      .where(sql`${table.entryType} = 'provider_link'`),
    providerSocialUnique: uniqueIndex('accounts_provider_social_unique')
      .on(table.provider, table.socialId)
      .where(sql`${table.entryType} = 'provider_link'`),
    attachedEmailNormalizedUnique: uniqueIndex(
      'accounts_attached_email_normalized_unique',
    )
      .on(table.attachedEmailNormalized)
      .where(
        sql`${table.entryType} = 'attached_email' AND ${table.attachedEmailNormalized} IS NOT NULL`,
      ),
  }),
);

export type AccountInsert = typeof accounts.$inferInsert;
export type AccountSelect = typeof accounts.$inferSelect;
