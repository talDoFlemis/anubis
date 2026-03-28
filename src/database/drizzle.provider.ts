import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { PgDatabase } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import { DRIZZLE } from './drizzle.constants';
import * as usersSchema from './schema/users';
import * as sessionsSchema from './schema/sessions';
import * as candidatesSchema from './schema/candidates';

const schema = {
  ...usersSchema,
  ...sessionsSchema,
  ...candidatesSchema,
};

export type DrizzleSchema = typeof schema;

/**
 * Widened type that accepts both `NodePgDatabase` (the global db instance)
 * and `PgTransaction` (per-request transactions), since both extend `PgDatabase`.
 */
export type DrizzleDB = PgDatabase<
  NodePgQueryResultHKT,
  DrizzleSchema,
  ExtractTablesWithRelations<DrizzleSchema>
>;

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const pool = new Pool({
      host: configService.getOrThrow<string>('DATABASE_HOST'),
      port: configService.getOrThrow<number>('DATABASE_PORT'),
      user: configService.getOrThrow<string>('DATABASE_USER'),
      password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
      database: configService.getOrThrow<string>('DATABASE_NAME'),
    });

    return drizzle(pool, { schema });
  },
};
