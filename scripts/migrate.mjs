import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'node:path';

async function main() {
  const host = process.env.DATABASE_HOST;
  const port = Number(process.env.DATABASE_PORT) || 5432;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const ssl = process.env.DATABASE_SSL === 'true';

  if (!host || !user || !password || !database) {
    console.error(
      'Missing required environment variables: DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME',
    );
    process.exit(1);
  }

  console.log(`Connecting to ${host}:${port}/${database} as ${user}...`);

  const pool = new Pool({ host, port, user, password, database, ssl });
  const db = drizzle(pool);

  try {
    const migrationsFolder = path.join(import.meta.dirname, '..', 'drizzle');
    console.log(`Running migrations from ${migrationsFolder}...`);

    await migrate(db, { migrationsFolder });

    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
