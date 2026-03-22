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

  const createTestUser = async (overrides: Partial<typeof baseUserData> = {}) =>
    repository.create({
      ...baseUserData,
      ...overrides,
    });

  const attachEmailToUser = async (params: {
    userId: string;
    email: string;
    verified?: boolean;
  }) =>
    repository.attachOwnedEmail({
      userId: params.userId,
      email: params.email,
      normalizedEmail: params.email.toLowerCase(),
      verifiedAt: params.verified === false ? undefined : new Date(),
    });

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

  it('creates and finds a user with lifecycle fields', async () => {
    const created = await repository.create(baseUserData);

    expect(created.id).toBeDefined();
    expect(created.onboardingCompleted).toBe(true);
    expect(created.mustChangePassword).toBe(false);
    expect(created.confirmEmailTokenVersion).toBe(0);
    expect(created.forgotPasswordTokenVersion).toBe(0);

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.email).toBe('test@example.com');
    expect(found!.cpf).toBe('12345678901');
  });

  it('links providers and resolves provider accounts', async () => {
    const created = await repository.create(baseUserData);
    await repository.linkProviderAccount({
      userId: created.id,
      provider: AuthProvidersEnum.email,
      socialId: null,
    });
    await repository.linkProviderAccount({
      userId: created.id,
      provider: AuthProvidersEnum.google,
      socialId: 'google-123',
    });

    const foundByProvider = await repository.findByProviderAccount({
      provider: AuthProvidersEnum.google,
      socialId: 'google-123',
    });

    expect(foundByProvider).not.toBeNull();
    expect(foundByProvider!.id).toBe(created.id);
    expect(foundByProvider!.linkedProviders.sort()).toEqual([
      'email',
      'google',
    ]);
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
    expect(updated!.bootstrapPasswordExpiresAt).not.toBeNull();

    await repository.remove(created.id);
    const found = await repository.findById(created.id);
    expect(found).toBeNull();

    const [row] = await db.select().from(users).where(eq(users.id, created.id));
    expect(row).toBeDefined();
    expect(row.deletedAt).toBeInstanceOf(Date);
  });

  describe('owned email persistence', () => {
    it('resolves owned verified emails for primary and attached addresses', async () => {
      const user = await createTestUser();
      const attached = await attachEmailToUser({
        userId: user.id,
        email: 'attached-verified@example.com',
        verified: true,
      });

      const primaryResult = await repository.findUserByOwnedVerifiedEmail(
        baseUserData.email,
      );
      expect(primaryResult).not.toBeNull();
      expect(primaryResult!.id).toBe(user.id);

      const attachedResult = await repository.findUserByOwnedVerifiedEmail(
        attached.email,
      );
      expect(attachedResult).not.toBeNull();
      expect(attachedResult!.id).toBe(user.id);
    });

    it('does not resolve unverified attached emails', async () => {
      const user = await createTestUser({ email: 'other@example.com' });
      await attachEmailToUser({
        userId: user.id,
        email: 'unverified@example.com',
        verified: false,
      });

      const found = await repository.findUserByOwnedVerifiedEmail(
        'unverified@example.com',
      );
      expect(found).toBeNull();
    });

    it('promotes an attached email to primary', async () => {
      const user = await createTestUser();
      const attached = await attachEmailToUser({
        userId: user.id,
        email: 'promote@example.com',
        verified: true,
      });

      const promoted = await repository.promoteOwnedEmailToPrimary({
        userId: user.id,
        accountId: attached.accountId!,
      });

      expect(promoted).not.toBeNull();
      expect(promoted!.email).toBe(attached.email);

      const refreshed = await repository.findById(user.id);
      expect(refreshed).not.toBeNull();
      expect(refreshed!.email).toBe(attached.email);
    });

    it('rejects duplicate normalized attached emails across users', async () => {
      const user = await createTestUser();
      await attachEmailToUser({
        userId: user.id,
        email: 'duplicate@example.com',
        verified: true,
      });

      const other = await createTestUser({
        email: 'second@example.com',
        cpf: '98765432100',
      });

      await expect(
        attachEmailToUser({
          userId: other.id,
          email: 'Duplicate@example.com',
          verified: true,
        }),
      ).rejects.toThrow();

      const stillBelongsToFirst = await repository.findUserByOwnedVerifiedEmail(
        'duplicate@example.com',
      );
      expect(stillBelongsToFirst).not.toBeNull();
      expect(stillBelongsToFirst!.id).toBe(user.id);
    });
  });
});
