import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { DRIZZLE } from './drizzle.constants';
import * as candidatesSchema from './schema/candidates';
import * as cvItemsSchema from './schema/cv-items';
import * as cvScoringSchema from './schema/cv-scoring';
import * as enrollmentPeriodsSchema from './schema/enrollment-periods';
import * as enrollmentsSchema from './schema/enrollments';
import * as filesSchema from './schema/files';
import * as researchThemesSchema from './schema/research-themes';
import * as sessionsSchema from './schema/sessions';
import * as universitiesSchema from './schema/universities';
import * as usersSchema from './schema/users';

const schema = {
  ...usersSchema,
  ...sessionsSchema,
  ...candidatesSchema,
  ...researchThemesSchema,
  ...enrollmentPeriodsSchema,
  ...enrollmentsSchema,
  ...filesSchema,
  ...universitiesSchema,
  ...cvScoringSchema,
  ...cvItemsSchema,
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
