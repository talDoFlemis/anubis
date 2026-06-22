import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';

import { eq, or, sql } from 'drizzle-orm';

import { enrollments } from '../database/schema/enrollments';

import { cvItems } from '../database/schema/cv-items';
import { researchThemes } from '../database/schema/research-themes';

@Injectable()
export class ValidationService {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {}

  async getCandidatesForDashboard() {
    // Query to join enrollments, cv_items (to sum scores) and research_themes (via primaryThemeId)
    // We'll group by enrollment to get the sum of scores per enrollment.
    // We'll also get the research theme details (title, level) from the primary theme.
    // The university and ira are taken from the enrollments table.
    const results = await this.db
      .select({
        enrollmentId: enrollments.id,
        candidateId: enrollments.candidateId,
        university: enrollments.undergradUniversity,
        ira: enrollments.ira,
        status: enrollments.status,
        // Sum of scores from cv_items, treating null as 0
        totalScore: sql<number>`coalesce(sum(${cvItems.score}), 0)`,
        // Research theme details (from primaryThemeId)
        researchThemeTitle: researchThemes.title,
        researchThemeLevel: researchThemes.level,
      })
      .from(enrollments)
      .leftJoin(cvItems, eq(enrollments.id, cvItems.enrollmentId))
      .leftJoin(researchThemes, eq(enrollments.primaryThemeId, researchThemes.id))
      .groupBy(
        enrollments.id,
        enrollments.candidateId,
        enrollments.undergradUniversity,
        enrollments.ira,
        enrollments.status,
        researchThemes.title,
        researchThemes.level,
      )
      .orderBy(enrollments.createdAt);

    return results;
  }

  async getValidationStats() {
    // We'll count:
    //   total: count of all enrollments
    //   validated: count of enrollments with status in ['submitted', 'closed']
    //   pending: count of enrollments with status 'draft'
    const [totalResult, validatedResult, pendingResult] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)` }).from(enrollments),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .where(or(eq(enrollments.status, 'submitted'), eq(enrollments.status, 'closed'))),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .where(eq(enrollments.status, 'draft')),
    ]);

    return {
      total: Number(totalResult[0].count),
      validated: Number(validatedResult[0].count),
      pending: Number(pendingResult[0].count),
    };
  }
}
