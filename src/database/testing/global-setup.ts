import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CONTAINER_ID_FILE = path.join(os.tmpdir(), 'anubis-test-container-id');

export default async function globalSetup() {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();

  const connectionUri = container.getConnectionUri();
  const pool = new Pool({ connectionString: connectionUri });
  const db = drizzle(pool);

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'drizzle'),
  });

  await pool.end();

  // Make connection URI available to test workers
  process.env.TEST_DATABASE_URL = connectionUri;

  // Persist container ID so globalTeardown can stop it
  fs.writeFileSync(
    CONTAINER_ID_FILE,
    JSON.stringify({
      containerId: container.getId(),
      connectionUri,
    }),
  );
}
