import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';

import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { cvItems } from '../database/schema/cv-items';
import { enrollments } from '../database/schema/enrollments';
import { researchThemeProfessors, researchThemes } from '../database/schema/research-themes';
import { users } from '../database/schema/users';
import { RoleEnum } from '../roles/roles.enum';
import type { User } from '../users/domain/user';

@Injectable()
export class ValidationService {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async getCandidatesForDashboard(user: User) {
    // Aliases to join users table for candidate and professor
    const candidateUsers = alias(users, 'candidate_users');
    const professorUsers = alias(users, 'professor_users');

    // Get professor's research theme IDs (both owner and associated)
    let themeIds: string[] = [];
    if (user.role === RoleEnum.professor) {
      const professorThemes = await this.db
        .select({ id: researchThemes.id })
        .from(researchThemes)
        .leftJoin(
          researchThemeProfessors,
          eq(researchThemes.id, researchThemeProfessors.researchThemeId),
        )
        .where(
          or(
            eq(researchThemes.professorId, user.id),
            eq(researchThemeProfessors.professorId, user.id),
          ),
        );
      themeIds = professorThemes.map(t => t.id);

      if (themeIds.length === 0) {
        return [];
      }
    }

    const whereConditions = [
      or(eq(enrollments.status, 'submitted'), eq(enrollments.status, 'closed')),
    ];

    if (user.role === RoleEnum.professor) {
      whereConditions.push(
        or(
          inArray(enrollments.primaryThemeId, themeIds),
          inArray(enrollments.secondaryThemeId, themeIds),
        ),
      );
    }

    const results = await this.db
      .select({
        enrollmentId: enrollments.id,
        candidateFirstName: candidateUsers.firstName,
        candidateLastName: candidateUsers.lastName,
        candidateEmail: candidateUsers.email,
        themeName: researchThemes.title,
        professorFirstName: professorUsers.firstName,
        professorLastName: professorUsers.lastName,
        level: enrollments.level,
        declaredScore: enrollments.scoreDraft,
        validatedScore: enrollments.scoreValidated,
        submittedAt: enrollments.submittedAt,
        primaryThemeId: enrollments.primaryThemeId,
        secondaryThemeId: enrollments.secondaryThemeId,
        ira: enrollments.ira,
        totalItems: sql<number>`count(${cvItems.id})`,
        verifiedItems: sql<number>`sum(case when ${cvItems.isVerified} in ('verified', 'incorrect') then 1 else 0 end)`,
      })
      .from(enrollments)
      .innerJoin(candidateUsers, eq(enrollments.candidateId, candidateUsers.id))
      .leftJoin(researchThemes, eq(enrollments.primaryThemeId, researchThemes.id))
      .leftJoin(professorUsers, eq(researchThemes.professorId, professorUsers.id))
      .leftJoin(cvItems, eq(enrollments.id, cvItems.enrollmentId))
      .where(and(...whereConditions))
      .groupBy(
        enrollments.id,
        candidateUsers.firstName,
        candidateUsers.lastName,
        candidateUsers.email,
        researchThemes.title,
        professorUsers.firstName,
        professorUsers.lastName,
        enrollments.level,
        enrollments.scoreDraft,
        enrollments.scoreValidated,
        enrollments.submittedAt,
        enrollments.primaryThemeId,
        enrollments.secondaryThemeId,
        enrollments.ira,
      )
      .orderBy(enrollments.submittedAt);

    return results.map(r => {
      const total = Number(r.totalItems || 0);
      const verified = Number(r.verifiedItems || 0);

      let status: 'pending' | 'in_progress' | 'completed' = 'pending';
      if (total > 0) {
        if (verified === total) {
          status = 'completed';
        } else if (verified > 0) {
          status = 'in_progress';
        }
      }

      return {
        enrollmentId: r.enrollmentId,
        candidateName: `${r.candidateFirstName || ''} ${r.candidateLastName || ''}`.trim(),
        candidateEmail: r.candidateEmail,
        themeName: r.themeName || 'Nenhum',
        professorName: r.professorFirstName
          ? `${r.professorFirstName} ${r.professorLastName || ''}`.trim()
          : undefined,
        level: r.level,
        declaredScore: r.declaredScore ? parseFloat(r.declaredScore) : 0,
        validatedScore: r.validatedScore ? parseFloat(r.validatedScore) : null,
        status,
        submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
        primaryThemeId: r.primaryThemeId,
        secondaryThemeId: r.secondaryThemeId,
        ira: r.ira ? parseFloat(r.ira) : null,
      };
    });
  }

  async getValidationStats() {
    const allCandidates = await this.getCandidatesForDashboard({
      role: RoleEnum.mdccSecretary,
    } as User);

    const total = allCandidates.length;
    let validated = 0;
    let pending = 0;
    let inProgress = 0;

    for (const c of allCandidates) {
      if (c.status === 'completed') {
        validated++;
      } else if (c.status === 'in_progress') {
        inProgress++;
      } else {
        pending++;
      }
    }

    return {
      total,
      validated,
      pending,
      inProgress,
    };
  }
}
