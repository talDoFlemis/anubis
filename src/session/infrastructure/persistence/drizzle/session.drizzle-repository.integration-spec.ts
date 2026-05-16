import type { Pool } from 'pg';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { sessions } from '../../../../database/schema/sessions';
import {
  createTestDrizzle,
  truncateAllTables,
  type TestDrizzleDB,
} from '../../../../database/testing/integration-database';
import { SessionDrizzleRepository } from './session.drizzle-repository';

describe('SessionDrizzleRepository (integration)', () => {
  let db: TestDrizzleDB;
  let pool: Pool;
  let repository: SessionDrizzleRepository;

  beforeAll(() => {
    const testDb = createTestDrizzle();
    db = testDb.db;
    pool = testDb.pool;
    repository = new SessionDrizzleRepository(db as unknown as DrizzleDB);
  });

  afterEach(async () => {
    await truncateAllTables(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  /** Helper to insert a session row directly. */
  async function insertSession(
    sid: string,
    userId: string,
    extraSessData: Record<string, unknown> = {},
  ) {
    const expire = new Date(Date.now() + 24 * 60 * 60 * 1000); // +1 day
    await db.insert(sessions).values({
      sid,
      sess: { userId, cookie: {}, ...extraSessData },
      expire,
    });
  }

  /** Helper to count remaining sessions. */
  async function getAllSessions() {
    return db.select().from(sessions);
  }

  describe('deleteByUserId', () => {
    it('should delete all sessions belonging to the given userId', async () => {
      await insertSession('sess-1', 'user-A');
      await insertSession('sess-2', 'user-A');
      await insertSession('sess-3', 'user-B');

      await repository.deleteByUserId('user-A');

      const remaining = await getAllSessions();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].sid).toBe('sess-3');
    });

    it('should do nothing when no sessions match', async () => {
      await insertSession('sess-1', 'user-A');

      await repository.deleteByUserId('user-nonexistent');

      const remaining = await getAllSessions();
      expect(remaining).toHaveLength(1);
    });
  });

  describe('deleteByUserIdWithExclude', () => {
    it('should delete all sessions for userId except the excluded one', async () => {
      await insertSession('sess-1', 'user-A');
      await insertSession('sess-2', 'user-A');
      await insertSession('sess-3', 'user-A');
      await insertSession('sess-4', 'user-B');

      await repository.deleteByUserIdWithExclude({
        userId: 'user-A',
        excludeSessionId: 'sess-2',
      });

      const remaining = await getAllSessions();
      expect(remaining).toHaveLength(2);

      const sids = remaining.map(r => r.sid).sort();
      expect(sids).toEqual(['sess-2', 'sess-4']);
    });

    it('should delete all sessions when excluded sid does not exist', async () => {
      await insertSession('sess-1', 'user-A');
      await insertSession('sess-2', 'user-A');

      await repository.deleteByUserIdWithExclude({
        userId: 'user-A',
        excludeSessionId: 'sess-nonexistent',
      });

      const remaining = await getAllSessions();
      expect(remaining).toHaveLength(0);
    });
  });

  describe('deleteById', () => {
    it('should delete a single session by its sid', async () => {
      await insertSession('sess-1', 'user-A');
      await insertSession('sess-2', 'user-A');

      await repository.deleteById('sess-1');

      const remaining = await getAllSessions();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].sid).toBe('sess-2');
    });

    it('should do nothing when sid does not exist', async () => {
      await insertSession('sess-1', 'user-A');

      await repository.deleteById('sess-nonexistent');

      const remaining = await getAllSessions();
      expect(remaining).toHaveLength(1);
    });
  });
});
