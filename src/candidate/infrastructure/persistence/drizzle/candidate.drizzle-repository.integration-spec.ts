import type { Pool } from 'pg';
import { AuthProvidersEnum } from '../../../../auth/auth-providers.enum';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import {
  createTestDrizzle,
  truncateAllTables,
  type TestDrizzleDB,
} from '../../../../database/testing/integration-database';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { UserDrizzleRepository } from '../../../../users/infrastructure/persistence/drizzle/user.drizzle-repository';
import { CandidateDrizzleRepository } from './candidate.drizzle-repository';

describe('CandidateDrizzleRepository (integration)', () => {
  let db: TestDrizzleDB;
  let pool: Pool;
  let candidateRepository: CandidateDrizzleRepository;
  let userRepository: UserDrizzleRepository;

  beforeAll(() => {
    const testDb = createTestDrizzle();
    db = testDb.db;
    pool = testDb.pool;
    candidateRepository = new CandidateDrizzleRepository(db as unknown as DrizzleDB);
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

  it('finds a joined candidate profile by user id', async () => {
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
      onboardingCompleted: true,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });

    await candidateRepository.upsertByUserId({
      userId: user.id,
      universityOfOrigin: 'UFRN',
      ira: '8.75',
      poscomp: 720,
    });

    const profile = await candidateRepository.findProfileByUserId(user.id);

    expect(profile).toMatchObject({
      userId: user.id,
      email: 'candidate@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      universityOfOrigin: 'UFRN',
      ira: '8.75',
      poscomp: 720,
    });
  });

  it('filters joined candidate profiles by user and candidate fields', async () => {
    const jane = await userRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: 'jane@example.com',
      email: 'jane@example.com',
      password: 'hash',
      cpf: '12345678901',
      firstName: 'Jane',
      lastName: 'Doe',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      onboardingCompleted: true,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });
    const john = await userRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: 'john@example.com',
      email: 'john@example.com',
      password: 'hash',
      cpf: '10987654321',
      firstName: 'John',
      lastName: 'Smith',
      role: RoleEnum.candidate,
      status: StatusEnum.inactive,
      onboardingCompleted: false,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });

    await candidateRepository.upsertByUserId({
      userId: jane.id,
      universityOfOrigin: 'UFRN',
      ira: '8.50',
      poscomp: 700,
    });
    await candidateRepository.upsertByUserId({
      userId: john.id,
      universityOfOrigin: 'USP',
      ira: '9.20',
      poscomp: 800,
    });

    const byUniversity = await candidateRepository.findAllByFilters({
      universityOfOrigin: 'UFRN',
    });
    expect(byUniversity.data).toHaveLength(1);
    expect(byUniversity.data[0]?.userId).toBe(jane.id);
    expect(byUniversity.pagination.total).toBe(1);

    const byStatus = await candidateRepository.findAllByFilters({
      status: StatusEnum.inactive,
    });
    expect(byStatus.data).toHaveLength(1);
    expect(byStatus.data[0]?.userId).toBe(john.id);

    const byFirstName = await candidateRepository.findAllByFilters({
      firstName: 'Jane',
    });
    expect(byFirstName.data).toHaveLength(1);
    expect(byFirstName.data[0]?.userId).toBe(jane.id);
  });

  it('filters joined candidate profiles by ira and poscomp range', async () => {
    const low = await userRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: 'low@example.com',
      email: 'low@example.com',
      password: 'hash',
      cpf: '12312312312',
      firstName: 'Low',
      lastName: 'Score',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      onboardingCompleted: true,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });
    const high = await userRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: 'high@example.com',
      email: 'high@example.com',
      password: 'hash',
      cpf: '32132132132',
      firstName: 'High',
      lastName: 'Score',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      onboardingCompleted: true,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });

    await candidateRepository.upsertByUserId({
      userId: low.id,
      universityOfOrigin: 'UFC',
      ira: '7.20',
      poscomp: 500,
    });
    await candidateRepository.upsertByUserId({
      userId: high.id,
      universityOfOrigin: 'UFC',
      ira: '9.10',
      poscomp: 810,
    });

    const iraRange = await candidateRepository.findAllByFilters({
      iraMin: 8,
      iraMax: 10,
    });
    expect(iraRange.data).toHaveLength(1);
    expect(iraRange.data[0]?.userId).toBe(high.id);

    const poscompRange = await candidateRepository.findAllByFilters({
      poscompMin: 700,
      poscompMax: 900,
    });
    expect(poscompRange.data).toHaveLength(1);
    expect(poscompRange.data[0]?.userId).toBe(high.id);
  });

  it('paginates candidate list results', async () => {
    const first = await userRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: 'first@example.com',
      email: 'first@example.com',
      password: 'hash',
      cpf: '11111111111',
      firstName: 'Ana',
      lastName: 'Alpha',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      onboardingCompleted: true,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });
    const second = await userRepository.create({
      authProvider: AuthProvidersEnum.email,
      providerSubject: 'second@example.com',
      email: 'second@example.com',
      password: 'hash',
      cpf: '22222222222',
      firstName: 'Bia',
      lastName: 'Beta',
      role: RoleEnum.candidate,
      status: StatusEnum.active,
      onboardingCompleted: true,
      mustChangePassword: false,
      confirmEmailTokenVersion: 0,
      forgotPasswordTokenVersion: 0,
    });

    await candidateRepository.upsertByUserId({
      userId: first.id,
      universityOfOrigin: 'UFC',
    });
    await candidateRepository.upsertByUserId({
      userId: second.id,
      universityOfOrigin: 'UFC',
    });

    const pageOne = await candidateRepository.findAllByFilters({
      page: 1,
      limit: 1,
    });
    const pageTwo = await candidateRepository.findAllByFilters({
      page: 2,
      limit: 1,
    });

    expect(pageOne.data).toHaveLength(1);
    expect(pageTwo.data).toHaveLength(1);
    expect(pageOne.pagination.total).toBe(2);
    expect(pageOne.pagination.totalPages).toBe(2);
    expect(pageOne.pagination.page).toBe(1);
    expect(pageTwo.pagination.page).toBe(2);
  });
});
