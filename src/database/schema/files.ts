import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  originalName: varchar('original_name', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  bucket: varchar('bucket', { length: 255 }).notNull(),
  key: varchar('key', { length: 1000 }).notNull(),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  purpose: varchar('purpose', { length: 100 }).notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FileInsert = typeof files.$inferInsert;
export type FileSelect = typeof files.$inferSelect;
