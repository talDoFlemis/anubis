import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as candidatesSchema from '../schema/candidates';
import * as researchThemesSchema from '../schema/research-themes';
import * as sessionsSchema from '../schema/sessions';
import * as usersSchema from '../schema/users';

const schema = {
  ...usersSchema,
  ...sessionsSchema,
  ...candidatesSchema,
  ...researchThemesSchema,
};

export type TestDrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Creates a Drizzle DB instance connected to the test container.
 *
 * Must be called after globalSetup has set process.env.TEST_DATABASE_URL.
 * The caller is responsible for calling pool.end() in afterAll.
 */
export function createTestDrizzle(): { db: TestDrizzleDB; pool: Pool } {
  const connectionUri = process.env.TEST_DATABASE_URL;

  if (!connectionUri) {
    throw new Error(
      'TEST_DATABASE_URL is not set. ' + 'Ensure Jest globalSetup (global-setup.ts) has run.',
    );
  }

  const pool = new Pool({ connectionString: connectionUri });
  const db = drizzle(pool, { schema });

  return { db, pool };
}

/**
 * Truncates all application tables, resetting data between tests.
 */
export async function truncateAllTables(db: TestDrizzleDB): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE research_themes, candidates, users, session RESTART IDENTITY CASCADE`,
  );
}
