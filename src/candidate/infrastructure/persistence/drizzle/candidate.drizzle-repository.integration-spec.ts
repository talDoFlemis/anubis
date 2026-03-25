import { Pool } from 'pg';
import {
  createTestDrizzle,
  truncateAllTables,
  type TestDrizzleDB,
} from '../../../../database/testing/integration-database';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { CandidateDrizzleRepository } from './candidate.drizzle-repository';
import { UserDrizzleRepository } from '../../../../users/infrastructure/persistence/drizzle/user.drizzle-repository';
import { AuthProvidersEnum } from '../../../../auth/auth-providers.enum';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';

describe('CandidateDrizzleRepository (integration)', () => {
  let db: TestDrizzleDB;
  let pool: Pool;
  let candidateRepository: CandidateDrizzleRepository;
  let userRepository: UserDrizzleRepository;

  beforeAll(() => {
    const testDb = createTestDrizzle();
    db = testDb.db;
    pool = testDb.pool;
    candidateRepository = new CandidateDrizzleRepository(
      db as unknown as DrizzleDB,
    );
    userRepository = new UserDrizzleRepository(db as unknown as DrizzleDB);
  });

  afterEach(async () => {
    await truncateAllTables(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('upserts candidate profile by user id', async () => {
    const user = await userRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: 'candidate@example.com',
      email: 'candidate@example.com',
      password: 'hash',
      cpf: '12345678901',
      firstName: 'Jane',
      lastName: 'Doe',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      onboardingCompleted: false,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });

    const created = await candidateRepository.upsertByUserId({
      userId: user.id,
      universityOfOrigin: 'UFRN',
      ira: '8.75',
      poscomp: 720,
    });

    expect(created.userId).toBe(user.id);
    expect(created.universityOfOrigin).toBe('UFRN');

    const updated = await candidateRepository.upsertByUserId({
      userId: user.id,
      universityOfOrigin: 'USP',
      ira: '9.10',
      poscomp: 800,
    });

    expect(updated.universityOfOrigin).toBe('USP');
    expect(updated.ira).toBe('9.10');
    expect(updated.poscomp).toBe(800);
  });
});
