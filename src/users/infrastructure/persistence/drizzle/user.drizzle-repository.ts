import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type {
  DrizzleDB,
  DrizzleSchema,
} from '../../../../database/drizzle.provider';
import { accounts } from '../../../../database/schema/accounts';
import { users } from '../../../../database/schema/users';
import { AuthProvidersEnum } from '../../../../auth/auth-providers.enum';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { User } from '../../../domain/user';
import {
  type AttachOwnedEmailData,
  CreateUserData,
  type DetachOwnedEmailData,
  type PromoteOwnedEmailData,
  type UserOwnedEmail,
  NullableUser,
  UpdateUserData,
  UserRepository,
} from '../user.repository';

type UserRow = typeof users.$inferSelect;
type AttachedEmailRow = Pick<
  typeof accounts.$inferSelect,
  | 'id'
  | 'attachedEmail'
  | 'attachedEmailNormalized'
  | 'attachedEmailVerifiedAt'
  | 'attachedEmailVerificationTokenVersion'
>;

const PROVIDER_LINK_ENTRY_TYPE = 'provider_link';
const ATTACHED_EMAIL_ENTRY_TYPE = 'attached_email';

@Injectable()
export class UserDrizzleRepository extends UserRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(data: CreateUserData): Promise<User> {
    const [row] = await this.db
      .insert(users)
      .values({
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
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<NullableUser> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    if (!row) return null;
    return this.toDomain(row);
  }

  async listUserEmails(userId: string): Promise<UserOwnedEmail[]> {
    const [userRow] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!userRow) {
      return [];
    }

    const attachedEmailRows = await this.db
      .select({
        id: accounts.id,
        attachedEmail: accounts.attachedEmail,
        attachedEmailNormalized: accounts.attachedEmailNormalized,
        attachedEmailVerifiedAt: accounts.attachedEmailVerifiedAt,
        attachedEmailVerificationTokenVersion:
          accounts.attachedEmailVerificationTokenVersion,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          eq(accounts.entryType, ATTACHED_EMAIL_ENTRY_TYPE),
          isNotNull(accounts.attachedEmail),
        ),
      );

    const ownedEmails: UserOwnedEmail[] = [];

    if (userRow.email) {
      ownedEmails.push({
        accountId: null,
        email: userRow.email,
        normalizedEmail: userRow.email.toLowerCase(),
        verifiedAt: null,
        verificationTokenVersion: userRow.confirmEmailTokenVersion,
        isPrimary: true,
      });
    }

    return ownedEmails.concat(
      attachedEmailRows.map((row) => this.mapAttachedEmailToOwnedEmail(row)),
    );
  }

  async attachOwnedEmail(data: AttachOwnedEmailData): Promise<UserOwnedEmail> {
    const [row] = await this.db
      .insert(accounts)
      .values({
        userId: data.userId,
        entryType: ATTACHED_EMAIL_ENTRY_TYPE,
        provider: AuthProvidersEnum.email,
        attachedEmail: data.email,
        attachedEmailNormalized: data.normalizedEmail,
        attachedEmailVerifiedAt: data.verifiedAt ?? null,
        attachedEmailVerificationTokenVersion:
          data.verificationTokenVersion ?? 0,
      })
      .returning({
        id: accounts.id,
        attachedEmail: accounts.attachedEmail,
        attachedEmailNormalized: accounts.attachedEmailNormalized,
        attachedEmailVerifiedAt: accounts.attachedEmailVerifiedAt,
        attachedEmailVerificationTokenVersion:
          accounts.attachedEmailVerificationTokenVersion,
      });

    return this.mapAttachedEmailToOwnedEmail(row);
  }

  async detachOwnedEmail(data: DetachOwnedEmailData): Promise<void> {
    await this.db
      .delete(accounts)
      .where(
        and(
          eq(accounts.id, data.accountId),
          eq(accounts.userId, data.userId),
          eq(accounts.entryType, ATTACHED_EMAIL_ENTRY_TYPE),
        ),
      );
  }

  async promoteOwnedEmailToPrimary(
    params: PromoteOwnedEmailData,
  ): Promise<NullableUser> {
    const db = this.db as NodePgDatabase<DrizzleSchema>;

    return db.transaction(async (tx) => {
      const [userRow] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, params.userId), isNull(users.deletedAt)))
        .limit(1);

      if (!userRow) {
        return null;
      }

      const [attachedEmailRow] = await tx
        .select({
          id: accounts.id,
          attachedEmail: accounts.attachedEmail,
          attachedEmailNormalized: accounts.attachedEmailNormalized,
          attachedEmailVerifiedAt: accounts.attachedEmailVerifiedAt,
          attachedEmailVerificationTokenVersion:
            accounts.attachedEmailVerificationTokenVersion,
        })
        .from(accounts)
        .where(
          and(
            eq(accounts.id, params.accountId),
            eq(accounts.userId, params.userId),
            eq(accounts.entryType, ATTACHED_EMAIL_ENTRY_TYPE),
          ),
        )
        .limit(1);

      if (!attachedEmailRow?.attachedEmail) {
        return null;
      }

      const previousPrimaryEmail = userRow.email;

      await tx
        .update(users)
        .set({
          email: attachedEmailRow.attachedEmail,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRow.id));

      if (previousPrimaryEmail) {
        await tx
          .update(accounts)
          .set({
            attachedEmail: previousPrimaryEmail,
            attachedEmailNormalized: previousPrimaryEmail.toLowerCase(),
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, attachedEmailRow.id));
      } else {
        await tx.delete(accounts).where(eq(accounts.id, attachedEmailRow.id));
      }

      const providerRows = await tx
        .select({ provider: accounts.provider })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, userRow.id),
            eq(accounts.entryType, PROVIDER_LINK_ENTRY_TYPE),
          ),
        );

      return this.mapToDomain(
        {
          ...userRow,
          email: attachedEmailRow.attachedEmail,
          updatedAt: new Date(),
        },
        providerRows,
      );
    });
  }

  async findByCpf(cpf: string): Promise<NullableUser> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.cpf, cpf), isNull(users.deletedAt)))
      .limit(1);

    if (!row) return null;
    return this.toDomain(row);
  }

  async findByProviderAccount(params: {
    providerId: string;
    provider: AuthProvidersEnum;
  }): Promise<NullableUser> {
    const [row] = await this.db
      .select({ user: users })
      .from(accounts)
      .innerJoin(users, eq(accounts.userId, users.id))
      .where(
        and(
          eq(accounts.provider, params.provider),
          eq(accounts.providerId, params.providerId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    if (!row) return null;
    return this.toDomain(row.user);
  }

  async linkProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
    providerId?: string | null;
  }): Promise<void> {
    await this.db.insert(accounts).values({
      userId: params.userId,
      provider: params.provider,
      providerId: params.providerId ?? null,
    });
  }

  async hasProviderAccount(params: {
    userId: string;
    provider: AuthProvidersEnum;
  }): Promise<boolean> {
    const [account] = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, params.userId),
          eq(accounts.provider, params.provider),
          eq(accounts.entryType, PROVIDER_LINK_ENTRY_TYPE),
        ),
      )
      .limit(1);

    return Boolean(account);
  }

  async update(id: string, payload: UpdateUserData): Promise<NullableUser> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (payload.email !== undefined) updateData.email = payload.email;
    if (payload.password !== undefined) updateData.password = payload.password;
    if (payload.cpf !== undefined) updateData.cpf = payload.cpf;
    if (payload.firstName !== undefined)
      updateData.firstName = payload.firstName;
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
      updateData.bootstrapPasswordExpiresAt =
        payload.bootstrapPasswordExpiresAt;
    }
    if (payload.confirmEmailTokenVersion !== undefined) {
      updateData.confirmEmailTokenVersion = payload.confirmEmailTokenVersion;
    }
    if (payload.forgotPasswordTokenVersion !== undefined) {
      updateData.forgotPasswordTokenVersion =
        payload.forgotPasswordTokenVersion;
    }

    const [row] = await this.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning();

    if (!row) return null;
    return this.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
  }

  private async toDomain(row: UserRow): Promise<User> {
    const accountRows = await this.db
      .select({ provider: accounts.provider })
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, row.id),
          eq(accounts.entryType, PROVIDER_LINK_ENTRY_TYPE),
        ),
      );

    return this.mapToDomain(row, accountRows);
  }

  private mapAttachedEmailToOwnedEmail(row: AttachedEmailRow): UserOwnedEmail {
    return {
      accountId: row.id,
      email: row.attachedEmail as string,
      normalizedEmail: row.attachedEmailNormalized,
      verifiedAt: row.attachedEmailVerifiedAt,
      verificationTokenVersion: row.attachedEmailVerificationTokenVersion,
      isPrimary: false,
    };
  }

  private mapToDomain(
    row: UserRow,
    accountRows: Array<{
      provider: (typeof accounts.$inferSelect)['provider'];
    }>,
  ): User {
    return {
      id: row.id,
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
      linkedProviders: accountRows.map(
        (account) => account.provider as AuthProvidersEnum,
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
