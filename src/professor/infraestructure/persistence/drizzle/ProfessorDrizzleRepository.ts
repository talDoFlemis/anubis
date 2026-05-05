import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '@database/drizzle.constants';
import type { DrizzleDB } from '@database/drizzle.provider';
import { professors } from '@database/schema/professor';
import { users } from '@database/schema/users';
import { User } from '@users/domain/user';
import { Professor } from '../../../domain/professor';
import type {
  CreateProfessorData,
  NullableProfessor,
  UpdateProfessorData,
} from '../professor.repository';
import { ProfessorRepository } from '../professor.repository';

@Injectable()
export class ProfessorDrizzleRepository extends ProfessorRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(data: CreateProfessorData): Promise<Professor> {
    return this.db.transaction(async tx => {
      const [userRow] = await tx
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

      if (!userRow) {
        throw new InternalServerErrorException('Falha ao criar usuario do professor.');
      }

      const [profRow] = await tx
        .insert(professors)
        .values({
          userId: userRow.id,
          department: data.department,
          institution: data.institution,
        })
        .returning();

      if (!profRow) {
        throw new InternalServerErrorException('Falha ao criar professor.');
      }

      return Professor.fromRows(userRow, profRow);
    });
  }

  async findById(id: User['id']): Promise<NullableProfessor> {
    const [row] = await this.db
      .select({
        user: users,
        professor: professors,
      })
      .from(professors)
      .innerJoin(users, eq(users.id, professors.userId))
      .where(eq(professors.userId, id))
      .limit(1);

    if (!row) return null;
    return Professor.fromRows(row.user, row.professor);
  }

  async findByDepartment(department: string): Promise<Professor[]> {
    const rows = await this.db
      .select({
        user: users,
        professor: professors,
      })
      .from(professors)
      .innerJoin(users, eq(users.id, professors.userId))
      .where(eq(professors.department, department));

    return rows.map(row => Professor.fromRows(row.user, row.professor));
  }

  async update(id: User['id'], data: UpdateProfessorData): Promise<NullableProfessor> {
    return this.db.transaction(async tx => {
      if (this.hasUserUpdates(data)) {
        await tx.update(users).set(this.toUserUpdates(data)).where(eq(users.id, id));
      }

      if (this.hasProfessorUpdates(data)) {
        await tx
          .update(professors)
          .set(this.toProfessorUpdates(data))
          .where(eq(professors.userId, id));
      }

      const [row] = await tx
        .select({
          user: users,
          professor: professors,
        })
        .from(professors)
        .innerJoin(users, eq(users.id, professors.userId))
        .where(eq(professors.userId, id))
        .limit(1);

      if (!row) return null;
      return Professor.fromRows(row.user, row.professor);
    });
  }

  async remove(id: User['id']): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  private hasUserUpdates(data: UpdateProfessorData): boolean {
    return (
      data.authProvider !== undefined ||
      data.providerSubject !== undefined ||
      data.email !== undefined ||
      data.password !== undefined ||
      data.cpf !== undefined ||
      data.firstName !== undefined ||
      data.lastName !== undefined ||
      data.role !== undefined ||
      data.status !== undefined ||
      data.onboardingCompleted !== undefined ||
      data.mustChangePassword !== undefined ||
      data.bootstrapPasswordExpiresAt !== undefined ||
      data.confirmEmailTokenVersion !== undefined ||
      data.forgotPasswordTokenVersion !== undefined
    );
  }

  private toUserUpdates(data: UpdateProfessorData): Record<string, unknown> {
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data.authProvider !== undefined) updates.authProvider = data.authProvider;
    if (data.providerSubject !== undefined) updates.providerSubject = data.providerSubject;
    if (data.email !== undefined) updates.email = data.email;
    if (data.password !== undefined) updates.password = data.password;
    if (data.cpf !== undefined) updates.cpf = data.cpf;
    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (data.role !== undefined) updates.role = data.role;
    if (data.status !== undefined) updates.status = data.status;
    if (data.onboardingCompleted !== undefined) {
      updates.onboardingCompleted = data.onboardingCompleted;
    }
    if (data.mustChangePassword !== undefined) {
      updates.mustChangePassword = data.mustChangePassword;
    }
    if (data.bootstrapPasswordExpiresAt !== undefined) {
      updates.bootstrapPasswordExpiresAt = data.bootstrapPasswordExpiresAt;
    }
    if (data.confirmEmailTokenVersion !== undefined) {
      updates.confirmEmailTokenVersion = data.confirmEmailTokenVersion;
    }
    if (data.forgotPasswordTokenVersion !== undefined) {
      updates.forgotPasswordTokenVersion = data.forgotPasswordTokenVersion;
    }

    return updates;
  }

  private hasProfessorUpdates(data: UpdateProfessorData): boolean {
    return data.department !== undefined || data.institution !== undefined;
  }

  private toProfessorUpdates(data: UpdateProfessorData): Record<string, unknown> {
    const updates: Record<string, unknown> = {};

    if (data.department !== undefined) updates.department = data.department;
    if (data.institution !== undefined) updates.institution = data.institution;

    return updates;
  }
}
