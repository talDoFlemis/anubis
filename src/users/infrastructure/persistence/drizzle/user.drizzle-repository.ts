import { Inject, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { and, eq } from 'drizzle-orm';
import { AuthProvidersEnum } from '../../../../auth/auth-providers.enum';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import { users } from '../../../../database/schema/users';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { User } from '../../../domain/user';
import { CreateUserData, NullableUser, UpdateUserData, UserRepository } from '../user.repository';

type UserRow = typeof users.$inferSelect;

@Injectable()
export class UserDrizzleRepository extends UserRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(data: CreateUserData): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
        authProvider: data.authProvider,
        providerSubject: data.providerSubject,
        email: data.email,
        password: data.password ?? null,
        cpf: data.cpf ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        status: data.status,
        onboardingCompleted: data.onboardingCompleted ?? true,
        mustChangePassword: data.mustChangePassword ?? false,
        bootstrapPasswordExpiresAt: data.bootstrapPasswordExpiresAt ?? null,
        confirmEmailTokenVersion: data.confirmEmailTokenVersion ?? 0,
        forgotPasswordTokenVersion: data.forgotPasswordTokenVersion ?? 0,
      })
      .returning();

    return this.toDomain(row);
  }

  async findById(id: string): Promise<NullableUser> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<NullableUser> {
    const normalizedEmail = email.toLowerCase().trim();
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByCpf(cpf: string): Promise<NullableUser> {
    const [row] = await this.db.select().from(users).where(eq(users.cpf, cpf)).limit(1);

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByAuthProvider(params: {
    provider: AuthProvidersEnum;
    providerSubject: string;
  }): Promise<NullableUser> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.authProvider, params.provider),
          eq(users.providerSubject, params.providerSubject),
        ),
      )
      .limit(1);

    if (!row) return null;
    return this.toDomain(row);
  }

  async update(id: string, payload: UpdateUserData): Promise<NullableUser> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (payload.authProvider !== undefined) {
      updateData.authProvider = payload.authProvider;
    }
    if (payload.providerSubject !== undefined) {
      updateData.providerSubject = payload.providerSubject;
    }
    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.password !== undefined) updateData.password = payload.password;
    if (payload.cpf !== undefined) updateData.cpf = payload.cpf;
    if (payload.firstName !== undefined) {
      updateData.firstName = payload.firstName;
    }
    if (payload.lastName !== undefined) updateData.lastName = payload.lastName;
    if (payload.role !== undefined) updateData.role = payload.role;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = payload.onboardingCompleted;
    }
    if (payload.mustChangePassword !== undefined) {
      updateData.mustChangePassword = payload.mustChangePassword;
    }
    if (payload.bootstrapPasswordExpiresAt !== undefined) {
      updateData.bootstrapPasswordExpiresAt = payload.bootstrapPasswordExpiresAt;
    }
    if (payload.confirmEmailTokenVersion !== undefined) {
      updateData.confirmEmailTokenVersion = payload.confirmEmailTokenVersion;
    }
    if (payload.forgotPasswordTokenVersion !== undefined) {
      updateData.forgotPasswordTokenVersion = payload.forgotPasswordTokenVersion;
    }

    const [row] = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();

    if (!row) return null;
    return this.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  private toDomain(row: UserRow): User {
    return plainToInstance(User, {
      id: row.id,
      authProvider: row.authProvider as AuthProvidersEnum,
      providerSubject: row.providerSubject,
      email: row.email,
      password: row.password,
      cpf: row.cpf,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role as RoleEnum,
      status: row.status as StatusEnum,
      onboardingCompleted: row.onboardingCompleted,
      mustChangePassword: row.mustChangePassword,
      bootstrapPasswordExpiresAt: row.bootstrapPasswordExpiresAt,
      confirmEmailTokenVersion: row.confirmEmailTokenVersion,
      forgotPasswordTokenVersion: row.forgotPasswordTokenVersion,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
