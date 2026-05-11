import { AuthProvidersEnum } from '@/auth/auth-providers.enum';
import { RoleEnum } from '@/roles/roles.enum';
import { StatusEnum } from '@/statuses/statuses.enum';
import type { DrizzleDB } from '@database/drizzle.provider';
import { professors } from '@database/schema/professor';
import { users } from '@database/schema/users';
import {
  createTestDrizzle,
  truncateAllTables,
  type TestDrizzleDB,
} from '@database/testing/integration-database';
import { eq } from 'drizzle-orm';
import type { Pool } from 'pg';
import type { CreateProfessorData } from '../professor.repository';
import { ProfessorDrizzleRepository } from './ProfessorDrizzleRepository';

describe('ProfessorDrizzleRepository (integration)', () => {
  let db: TestDrizzleDB;
  let pool: Pool;
  let repository: ProfessorDrizzleRepository;

  const baseProfessorData: CreateProfessorData = {
    authProvider: AuthProvidersEnum.email,
    providerSubject: 'prof@university.edu',
    email: 'prof@university.edu',
    password: 'hashed-password',
    firstName: 'Alan',
    lastName: 'Turing',
    role: RoleEnum.professor,
    status: StatusEnum.active,
    department: 'Computer Science',
    institution: 'University of Cambridge',
    onboardingCompleted: true,
  };

  beforeAll(() => {
    const testDb = createTestDrizzle();
    db = testDb.db;
    pool = testDb.pool;
    repository = new ProfessorDrizzleRepository(db as unknown as DrizzleDB);
  });

  afterEach(async () => {
    await truncateAllTables(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates a professor and its associated user in a transaction', async () => {
    const created = await repository.create(baseProfessorData);

    expect(created.id).toBeDefined();
    expect(created.department).toBe('Computer Science');
    expect(created.email).toBe('prof@university.edu');

    const [profRow] = await db.select().from(professors).where(eq(professors.userId, created.id));
    const [userRow] = await db.select().from(users).where(eq(users.id, created.id));

    expect(profRow).toBeDefined();
    expect(userRow).toBeDefined();
  });

  it('finds a professor by user ID with joined data', async () => {
    const created = await repository.create(baseProfessorData);
    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.institution).toBe('University of Cambridge');
    expect(found?.firstName).toBe('Alan');
  });

  it('returns null when finding a non-existent professor', async () => {
    const found = await repository.findById('00000000-0000-0000-0000-000000000000');
    expect(found).toBeNull();
  });

  it('filters professors by department', async () => {
    await repository.create(baseProfessorData);
    await repository.create({
      ...baseProfessorData,
      email: 'other@university.edu',
      providerSubject: 'other@university.edu',
      department: 'Mathematics',
    });
    const csProfs = await repository.findAllByFilters({});
    expect(csProfs.data).toHaveLength(2);
  });

  it('updates user and professor fields simultaneously', async () => {
    const created = await repository.create(baseProfessorData);
    const updated = await repository.update(created.id, {
      firstName: 'Alonzo',
      department: 'Logic',
    });

    expect(updated?.firstName).toBe('Alonzo');
    expect(updated?.department).toBe('Logic');

    // Verify persistence
    const found = await repository.findById(created.id);
    expect(found?.firstName).toBe('Alonzo');
    expect(found?.department).toBe('Logic');
  });

  it('removes the user and relies on cascading for the professor record', async () => {
    const created = await repository.create(baseProfessorData);
    await repository.remove(created.id);

    const found = await repository.findById(created.id);
    expect(found).toBeNull();

    const [profRow] = await db.select().from(professors).where(eq(professors.userId, created.id));
    expect(profRow).toBeUndefined();
  });

  it('rolls back user creation if professor creation fails', async () => {
    const invalidData = {
      ...baseProfessorData,
      department: null as unknown as string, // Force a DB constraint error
    };

    await expect(repository.create(invalidData)).rejects.toThrow();

    const allUsers = await db.select().from(users);
    expect(allUsers).toHaveLength(0);
  });
});
