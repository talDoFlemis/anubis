import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
  uniqueIndex,
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
    socialId: varchar('social_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userProviderUnique: uniqueIndex('accounts_user_provider_unique').on(
      table.userId,
      table.provider,
    ),
    providerSocialUnique: uniqueIndex('accounts_provider_social_unique').on(
      table.provider,
      table.socialId,
    ),
  }),
);

export type AccountInsert = typeof accounts.$inferInsert;
export type AccountSelect = typeof accounts.$inferSelect;
