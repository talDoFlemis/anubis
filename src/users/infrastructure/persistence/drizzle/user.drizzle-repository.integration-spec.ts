import { Pool } from 'pg';
import {
  createTestDrizzle,
  truncateAllTables,
  type TestDrizzleDB,
} from '../../../../database/testing/integration-database';
import { UserDrizzleRepository } from './user.drizzle-repository';
import { AuthProvidersEnum } from '../../../../auth/auth-providers.enum';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { users } from '../../../../database/schema/users';
import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../../../../database/drizzle.provider';

describe('UserDrizzleRepository (integration)', () => {
  let db: TestDrizzleDB;
  let pool: Pool;
  let repository: UserDrizzleRepository;

  const baseUserData = {
    authProvider: AuthProvidersEnum.email,
    providerSubject: 'test@example.com',
    email: 'test@example.com',
    password: 'hashed-password',
    cpf: '12345678901',
    firstName: 'John',
    lastName: 'Doe',
    role: RoleEnum.candidate,
    status: StatusEnum.active,
    onboardingCompleted: true,
    mustChangePassword: false,
    bootstrapPasswordExpiresAt: null,
    confirmEmailTokenVersion: 0,
    forgotPasswordTokenVersion: 0,
  };

  beforeAll(() => {
    const testDb = createTestDrizzle();
    db = testDb.db;
    pool = testDb.pool;
    repository = new UserDrizzleRepository(db as unknown as DrizzleDB);
  });

  afterEach(async () => {
    await truncateAllTables(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates and finds an email user with provider metadata', async () => {
    const created = await repository.create(baseUserData);

    expect(created.id).toBeDefined();
    expect(created.authProvider).toBe(AuthProvidersEnum.email);
    expect(created.providerSubject).toBe('test@example.com');

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.email).toBe('test@example.com');
  });

  it('finds a user by provider subject', async () => {
    const created = await repository.create({
      ...baseUserData,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-123',
      email: 'google@example.com',
      password: null,
      cpf: '98765432100',
    });

    const found = await repository.findByAuthProvider({
      provider: AuthProvidersEnum.google,
      providerSubject: 'google-123',
    });

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.authProvider).toBe(AuthProvidersEnum.google);
  });

  it('updates lifecycle fields and soft deletes users', async () => {
    const created = await repository.create(baseUserData);

    const updated = await repository.update(created.id, {
      mustChangePassword: true,
      bootstrapPasswordExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      forgotPasswordTokenVersion: 2,
    });

    expect(updated).not.toBeNull();
    expect(updated!.mustChangePassword).toBe(true);
    expect(updated!.forgotPasswordTokenVersion).toBe(2);

    await repository.remove(created.id);
    const found = await repository.findById(created.id);
    expect(found).toBeNull();

    const [row] = await db.select().from(users).where(eq(users.id, created.id));
    expect(row).toBeDefined();
    expect(row.deletedAt).toBeInstanceOf(Date);
  });

  it('enforces unique auth provider and subject', async () => {
    await repository.create({
      ...baseUserData,
      authProvider: AuthProvidersEnum.google,
      providerSubject: 'google-123',
      email: 'first@example.com',
      password: null,
    });

    await expect(
      repository.create({
        ...baseUserData,
        authProvider: AuthProvidersEnum.google,
        providerSubject: 'google-123',
        email: 'second@example.com',
        password: null,
        cpf: '98765432100',
      }),
    ).rejects.toThrow();
  });
});
