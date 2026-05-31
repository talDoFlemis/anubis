#!/usr/bin/env ts-node
/**
 * Seeds CV scoring categories for all open enrollment periods.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/seed/seed-cv-categories.ts
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { enrollmentPeriods } from '../../src/database/schema/enrollment-periods';
import { cvScoringCategories } from '../../src/database/schema/cv-scoring';

const pool = new Pool({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
});

const db = drizzle(pool);

const MASTERS_CATEGORIES = [
  { name: 'Artigos publicados em periódicos', description: 'Artigos completos em periódicos indexados (Qualis A1-B2)', pointsPerItem: 1.0, maxPoints: 3.0, sortOrder: 1 },
  { name: 'Artigos publicados em conferências', description: 'Artigos completos em anais de conferências nacionais e internacionais', pointsPerItem: 0.75, maxPoints: 2.25, sortOrder: 2 },
  { name: 'Iniciação científica / TCC', description: 'Participação em projetos de IC ou trabalho de conclusão de curso com orientador', pointsPerItem: 0.5, maxPoints: 1.5, sortOrder: 3 },
  { name: 'Experiência profissional na área', description: 'Atuação profissional comprovada na área de Ciência da Computação', pointsPerItem: 0.5, maxPoints: 1.0, sortOrder: 4 },
  { name: 'Cursos e certificações', description: 'Cursos de extensão, especializações e certificações técnicas relevantes', pointsPerItem: 0.25, maxPoints: 1.0, sortOrder: 5 },
  { name: 'Participação em eventos', description: 'Apresentação de pôsteres, palestras ou workshops em eventos acadêmicos', pointsPerItem: 0.25, maxPoints: 0.75, sortOrder: 6 },
  { name: 'Premiações acadêmicas', description: 'Prêmios, menções honrosas e reconhecimentos acadêmicos', pointsPerItem: 0.5, maxPoints: 1.0, sortOrder: 7 },
];

const DOCTORAL_CATEGORIES = [
  { name: 'Artigos publicados em periódicos', description: 'Artigos completos em periódicos indexados (Qualis A1-B2)', pointsPerItem: 1.5, maxPoints: 6.0, sortOrder: 1 },
  { name: 'Artigos publicados em conferências', description: 'Artigos completos em anais de conferências nacionais e internacionais', pointsPerItem: 1.0, maxPoints: 4.0, sortOrder: 2 },
  { name: 'Dissertação de mestrado', description: 'Nota e relevância da dissertação de mestrado defendida', pointsPerItem: 2.0, maxPoints: 2.0, sortOrder: 3 },
  { name: 'Participação em projetos de pesquisa', description: 'Projetos de pesquisa com financiamento ou vinculação institucional', pointsPerItem: 1.0, maxPoints: 3.0, sortOrder: 4 },
  { name: 'Experiência docente', description: 'Atuação como professor ou monitor em nível superior', pointsPerItem: 0.5, maxPoints: 1.5, sortOrder: 5 },
  { name: 'Patentes e softwares registrados', description: 'Registros de propriedade intelectual na área', pointsPerItem: 1.0, maxPoints: 2.0, sortOrder: 6 },
  { name: 'Premiações acadêmicas', description: 'Prêmios, menções honrosas e reconhecimentos acadêmicos ou profissionais', pointsPerItem: 0.5, maxPoints: 1.5, sortOrder: 7 },
];

async function main() {
  const openPeriods = await db
    .select()
    .from(enrollmentPeriods)
    .where(eq(enrollmentPeriods.status, 'open'));

  if (openPeriods.length === 0) {
    console.log('[INFO] No open enrollment periods found. Nothing to seed.');
    process.exit(0);
  }

  for (const period of openPeriods) {
    // Check if categories already exist
    const existing = await db
      .select({ id: cvScoringCategories.id })
      .from(cvScoringCategories)
      .where(eq(cvScoringCategories.enrollmentPeriodId, period.id))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[SKIP] Period "${period.name}" already has scoring categories.`);
      continue;
    }

    const allCategories: { categories: typeof MASTERS_CATEGORIES; level: 'masters' | 'doctoral' }[] = [
      { categories: MASTERS_CATEGORIES, level: 'masters' },
      { categories: DOCTORAL_CATEGORIES, level: 'doctoral' },
    ];

    let totalSeeded = 0;
    for (const { categories, level } of allCategories) {
      for (const cat of categories) {
        await db.insert(cvScoringCategories).values({
          enrollmentPeriodId: period.id,
          name: cat.name,
          description: cat.description,
          pointsPerItem: cat.pointsPerItem.toString(),
          maxPoints: cat.maxPoints.toString(),
          level,
          sortOrder: cat.sortOrder,
        });
      }
      totalSeeded += categories.length;
    }

    console.log(`[SUCCESS] Seeded ${totalSeeded} categories for "${period.name}" (masters + doctoral)`);
  }

  await pool.end();
  console.log('[DONE] CV scoring categories seed completed.');
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
