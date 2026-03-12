import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { users } from '../../../../database/schema/users';
import { User } from '../../../domain/user';
import { NullableUser, UserRepository } from '../user.repository';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';

type UserRow = typeof users.$inferSelect;
type ProviderType = UserRow['provider'];
type RoleType = UserRow['role'];
type StatusType = UserRow['status'];

function toDomain(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    provider: row.provider,
    socialId: row.socialId,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role as RoleEnum,
    status: row.status as StatusEnum,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

@Injectable()
export class UserDrizzleRepository extends UserRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        email: data.email,
        password: data.password ?? null,
        provider: data.provider as ProviderType,
        socialId: data.socialId ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as RoleType,
        status: data.status as StatusType,
      })
      .returning();

    return toDomain(row);
  }

  async findById(id: string): Promise<NullableUser> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<NullableUser> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async findBySocialIdAndProvider(params: {
    socialId: string;
    provider: string;
  }): Promise<NullableUser> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.socialId, params.socialId),
          eq(users.provider, params.provider as ProviderType),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async update(
    id: string,
    payload: Partial<Omit<User, 'id' | 'createdAt' | 'deletedAt'>>,
  ): Promise<NullableUser> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.password !== undefined) updateData.password = payload.password;
    if (payload.provider !== undefined) updateData.provider = payload.provider;
    if (payload.socialId !== undefined) updateData.socialId = payload.socialId;
    if (payload.firstName !== undefined)
      updateData.firstName = payload.firstName;
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.role !== undefined) updateData.role = payload.role;
    if (payload.status !== undefined) updateData.status = payload.status;

    const [row] = await this.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    return row ? toDomain(row) : null;
  }

  async remove(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
  }
}
