import { pgTable, varchar, json, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Session table for connect-pg-simple.
 * This table schema matches the default expected by connect-pg-simple.
 */
export const sessions = pgTable(
  'session',
  {
    sid: varchar('sid').primaryKey(),
    sess: json('sess').notNull(),
    expire: timestamp('expire', {
      precision: 6,
      withTimezone: false,
    }).notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)],
);
