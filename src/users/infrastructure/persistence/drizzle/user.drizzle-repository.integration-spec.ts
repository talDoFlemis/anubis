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
    provider: AuthProvidersEnum.email,
    socialId: null,
    firstName: 'John',
    lastName: 'Doe',
    role: RoleEnum.candidate,
    status: StatusEnum.active,
  };

  beforeAll(() => {
    const testDb = createTestDrizzle();
    db = testDb.db;
    pool = testDb.pool;

    // Instantiate the repository directly with the real Drizzle DB.
    // The @Inject decorator is only relevant when using the NestJS DI container.
    repository = new UserDrizzleRepository(db as unknown as DrizzleDB);
  });

  afterEach(async () => {
    await truncateAllTables(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('create', () => {
    it('should insert a user and return a domain object with generated id and timestamps', async () => {
      const user = await repository.create(baseUserData);

      expect(user.id).toBeDefined();
      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('hashed-password');
      expect(user.provider).toBe('email');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.role).toBe(RoleEnum.candidate);
      expect(user.status).toBe(StatusEnum.active);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.deletedAt).toBeNull();
    });

    it('should create a social user with null password', async () => {
      const user = await repository.create({
        ...baseUserData,
        email: 'social@example.com',
        password: undefined,
        provider: AuthProvidersEnum.google,
        socialId: 'google-123',
      });

      expect(user.password).toBeNull();
      expect(user.provider).toBe('google');
      expect(user.socialId).toBe('google-123');
    });

    it('should enforce unique email constraint', async () => {
      await repository.create(baseUserData);

      await expect(repository.create(baseUserData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const created = await repository.create(baseUserData);

      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.email).toBe('test@example.com');
    });

    it('should return null when not found', async () => {
      const found = await repository.findById(
        '00000000-0000-0000-0000-000000000000',
      );

      expect(found).toBeNull();
    });

    it('should not return soft-deleted users', async () => {
      const created = await repository.create(baseUserData);
      await repository.remove(created.id);

      const found = await repository.findById(created.id);

      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      await repository.create(baseUserData);

      const found = await repository.findByEmail('test@example.com');

      expect(found).not.toBeNull();
      expect(found!.email).toBe('test@example.com');
    });

    it('should be case-insensitive', async () => {
      await repository.create(baseUserData);

      const found = await repository.findByEmail('TEST@EXAMPLE.COM');

      expect(found).not.toBeNull();
      expect(found!.email).toBe('test@example.com');
    });

    it('should return null when not found', async () => {
      const found = await repository.findByEmail('notfound@example.com');

      expect(found).toBeNull();
    });

    it('should not return soft-deleted users', async () => {
      const created = await repository.create(baseUserData);
      await repository.remove(created.id);

      const found = await repository.findByEmail('test@example.com');

      expect(found).toBeNull();
    });
  });

  describe('findBySocialIdAndProvider', () => {
    it('should return user when found by socialId and provider', async () => {
      await repository.create({
        ...baseUserData,
        email: 'google@example.com',
        provider: AuthProvidersEnum.google,
        socialId: 'google-456',
      });

      const found = await repository.findBySocialIdAndProvider({
        socialId: 'google-456',
        provider: 'google',
      });

      expect(found).not.toBeNull();
      expect(found!.socialId).toBe('google-456');
      expect(found!.provider).toBe('google');
    });

    it('should return null when socialId matches but provider does not', async () => {
      await repository.create({
        ...baseUserData,
        email: 'google@example.com',
        provider: AuthProvidersEnum.google,
        socialId: 'google-456',
      });

      const found = await repository.findBySocialIdAndProvider({
        socialId: 'google-456',
        provider: 'email',
      });

      expect(found).toBeNull();
    });

    it('should return null when not found', async () => {
      const found = await repository.findBySocialIdAndProvider({
        socialId: 'nonexistent',
        provider: 'google',
      });

      expect(found).toBeNull();
    });

    it('should not return soft-deleted users', async () => {
      const created = await repository.create({
        ...baseUserData,
        email: 'google@example.com',
        provider: AuthProvidersEnum.google,
        socialId: 'google-456',
      });
      await repository.remove(created.id);

      const found = await repository.findBySocialIdAndProvider({
        socialId: 'google-456',
        provider: 'google',
      });

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update specified fields and return updated user', async () => {
      const created = await repository.create(baseUserData);

      const updated = await repository.update(created.id, {
        firstName: 'Updated',
        lastName: 'Name',
      });

      expect(updated).not.toBeNull();
      expect(updated!.firstName).toBe('Updated');
      expect(updated!.lastName).toBe('Name');
      // Unchanged fields should persist
      expect(updated!.email).toBe('test@example.com');
      expect(updated!.password).toBe('hashed-password');
    });

    it('should update the updatedAt timestamp', async () => {
      const created = await repository.create(baseUserData);

      // Small delay to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 10));

      const updated = await repository.update(created.id, {
        firstName: 'Updated',
      });

      expect(updated!.updatedAt.getTime()).toBeGreaterThan(
        created.updatedAt.getTime(),
      );
    });

    it('should return null when updating nonexistent user', async () => {
      const updated = await repository.update(
        '00000000-0000-0000-0000-000000000000',
        { firstName: 'Ghost' },
      );

      expect(updated).toBeNull();
    });

    it('should not update soft-deleted users', async () => {
      const created = await repository.create(baseUserData);
      await repository.remove(created.id);

      const updated = await repository.update(created.id, {
        firstName: 'ShouldNotWork',
      });

      expect(updated).toBeNull();
    });

    it('should update email', async () => {
      const created = await repository.create(baseUserData);

      const updated = await repository.update(created.id, {
        email: 'newemail@example.com',
      });

      expect(updated!.email).toBe('newemail@example.com');
    });

    it('should update provider and socialId for account linking', async () => {
      const created = await repository.create(baseUserData);

      const updated = await repository.update(created.id, {
        provider: AuthProvidersEnum.google,
        socialId: 'google-linked-789',
      });

      expect(updated!.provider).toBe('google');
      expect(updated!.socialId).toBe('google-linked-789');
    });
  });

  describe('remove (soft delete)', () => {
    it('should set deletedAt without physically deleting the row', async () => {
      const created = await repository.create(baseUserData);

      await repository.remove(created.id);

      // Should not be found via findById (filters out deleted)
      const found = await repository.findById(created.id);
      expect(found).toBeNull();

      // But the row should still exist in the database
      const [row] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id));

      expect(row).toBeDefined();
      expect(row.deletedAt).toBeInstanceOf(Date);
    });
  });
});
