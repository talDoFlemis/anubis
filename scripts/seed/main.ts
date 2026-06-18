/* eslint-disable no-console */
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { candidates } from '../../src/database/schema/candidates';
import { cvScoringCategories } from '../../src/database/schema/cv-scoring';
import { enrollmentPeriods } from '../../src/database/schema/enrollment-periods';
import { professors } from '../../src/database/schema/professor';
import { researchThemeProfessors, researchThemes } from '../../src/database/schema/research-themes';
import { users } from '../../src/database/schema/users';
import { MASTERS_SECTIONS, DOCTORAL_SECTIONS } from '../../src/cv-scoring/constants/cv-scoring-config';

// ==========================================
// Types & Interfaces
// ==========================================
interface RawMockProfessor {
  nome: string;
  cpf: string;
  email: string;
  institution: string;
  department: string;
  status: 'active' | 'inactive' | 'disabled';
}

interface GeneratedProfessorData {
  email: string;
  cpf: string;
  firstName: string;
  lastName: string | null;
  institution: string;
  department: string;
  status: 'active' | 'inactive' | 'disabled';
}

interface DefaultUserData {
  email: string;
  role:
    | 'candidate'
    | 'professor'
    | 'mdcc-secretary'
    | 'post-graduate-coordinator'
    | 'post-graduate-vice-coordinator';
  firstName: string;
  lastName: string;
}

// ==========================================
// Mock Data Constants
// ==========================================
const MOCK_PROFESSOR_BASE: RawMockProfessor[] = [
  {
    nome: 'Dr. Ricardo Almeida',
    cpf: '12345678909',
    email: 'r.almeida@ufc.br',
    institution: 'UFC',
    department: 'Inteligencia Artificial',
    status: 'active',
  },
  {
    nome: 'Dra. Ana Souza',
    cpf: '39053344705',
    email: 'ana.souza@mdcc.ufc.br',
    institution: 'UFC',
    department: 'Engenharia de Software',
    status: 'inactive',
  },
  {
    nome: 'Dr. Carlos Mendes',
    cpf: '11144477735',
    email: 'c.mendes@ufc.br',
    institution: 'UFC',
    department: 'Sistemas Distribuidos',
    status: 'active',
  },
  {
    nome: 'Dr. João Silveira',
    cpf: '98765432100',
    email: 'j.silveira@ufc.br',
    institution: 'UFC',
    department: 'Redes de Computadores',
    status: 'inactive',
  },
];

const DEFAULT_USERS: DefaultUserData[] = [
  {
    email: 'candidate@anubis.com',
    role: 'candidate',
    firstName: 'Candidato',
    lastName: 'Padrão',
  },
  {
    email: 'professor@anubis.com',
    role: 'professor',
    firstName: 'Professor',
    lastName: 'Padrão',
  },
  {
    email: 'secretary@anubis.com',
    role: 'mdcc-secretary',
    firstName: 'Secretário',
    lastName: 'Padrão',
  },
  {
    email: 'coordinator@anubis.com',
    role: 'post-graduate-coordinator',
    firstName: 'Coordenador',
    lastName: 'Padrão',
  },
  {
    email: 'vice@anubis.com',
    role: 'post-graduate-vice-coordinator',
    firstName: 'Vice',
    lastName: 'Coordenador Padrão',
  },
];

// Categories are now loaded from centralized config

// ==========================================
// Helper Functions
// ==========================================
function generateMockProfessors(count: number): GeneratedProfessorData[] {
  return Array.from({ length: count }, (_, index) => {
    const base = MOCK_PROFESSOR_BASE[index % MOCK_PROFESSOR_BASE.length];
    const cycle = Math.floor(index / MOCK_PROFESSOR_BASE.length) + 1;

    const emailParts = base.email.split('@');
    if (emailParts.length !== 2) {
      throw new Error(`Malformed base email template encountered: ${base.email}`);
    }

    const email = cycle === 1 ? base.email : `${emailParts[0]}+${cycle}@${emailParts[1]}`;
    const splitNome = (cycle === 1 ? base.nome : `${base.nome} ${cycle}`).split(' ');

    const firstName = `${splitNome[0]} ${splitNome[1]}`;
    const lastName = splitNome.slice(2).join(' ') || null;
    const cpf = `${base.cpf.slice(0, 9)}${String(cycle).padStart(2, '0')}`.slice(0, 11);

    return {
      email,
      cpf,
      firstName,
      lastName,
      institution: base.institution,
      department: base.department,
      status: base.status,
    };
  });
}

function createDatabasePool(): Pool {
  return new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'anubis',
    ssl: process.env.DATABASE_SSL === 'true',
  });
}

// ==========================================
// Seeding Phases
// ==========================================

async function seedProfessors(db: NodePgDatabase): Promise<void> {
  const generatedProfessors = generateMockProfessors(14);
  console.log(`[INFO] Starting insertion of ${generatedProfessors.length} mock professors.`);

  await db.transaction(async tx => {
    for (const prof of generatedProfessors) {
      // 1. Insert user if conflict on email do nothing
      const rows = await tx
        .insert(users)
        .values({
          authProvider: 'email',
          providerSubject: prof.email,
          email: prof.email,
          password: '$2a$12$lr9fx486D2ZJT1rmHu4xtOUOxRuapGfZwmdDhVKNzpBCNlHNXwvc.', // bcrypt hash for senha123
          cpf: prof.cpf,
          firstName: prof.firstName,
          lastName: prof.lastName,
          role: 'professor',
          status: prof.status,
          onboardingCompleted: true,
          mustChangePassword: true,
        })
        .onConflictDoNothing({ target: users.email })
        .returning();

      let userId = Array.isArray(rows) && rows[0] ? rows[0].id : null;

      // If user existed already, find their ID
      if (!userId) {
        const [existing] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, prof.email))
          .limit(1);
        if (existing) {
          userId = existing.id;
        }
      }

      if (userId) {
        await tx
          .insert(professors)
          .values({
            userId,
            department: prof.department,
            institution: prof.institution,
          })
          .onConflictDoNothing({ target: professors.userId });
      } else {
        console.warn(`[WARN] Failed to insert or find user for email: ${prof.email}`);
      }
    }
  });

  console.log('[SUCCESS] Professors seed completed.');
}

async function seedDefaultUsersAndThemes(db: NodePgDatabase): Promise<void> {
  console.log('[INFO] Seeding default users...');
  const userMap: Record<string, string> = {};
  const hash = await bcrypt.hash('senha123', 10);

  for (const defaultUser of DEFAULT_USERS) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, defaultUser.email))
      .limit(1);

    let userId: string;
    if (existing) {
      console.log(`[INFO] User ${defaultUser.email} already exists.`);
      userId = existing.id;
      userMap[defaultUser.email] = userId;
    } else {
      const [inserted] = await db
        .insert(users)
        .values({
          authProvider: 'email',
          providerSubject: defaultUser.email,
          email: defaultUser.email,
          password: hash,
          cpf: defaultUser.email.startsWith('candidate')
            ? '00000000001'
            : defaultUser.email.startsWith('professor')
              ? '00000000002'
              : defaultUser.email.startsWith('secretary')
                ? '00000000003'
                : defaultUser.email.startsWith('coordinator')
                  ? '00000000004'
                  : '00000000005',
          firstName: defaultUser.firstName,
          lastName: defaultUser.lastName,
          role: defaultUser.role,
          status: 'active',
          onboardingCompleted: true,
          mustChangePassword: false,
        })
        .returning();

      console.log(`[SUCCESS] Seeded default user: ${defaultUser.email}`);
      userId = inserted.id;
      userMap[defaultUser.email] = userId;
    }

    if (defaultUser.role === 'professor') {
      await db
        .insert(professors)
        .values({
          userId,
          department: 'Metodologias e Técnicas de Computação',
          institution: 'UFC',
        })
        .onConflictDoNothing();
    }

    if (defaultUser.role === 'candidate') {
      await db.insert(candidates).values({ userId }).onConflictDoNothing();
    }
  }

  console.log('[INFO] Seeding research themes...');
  const defaultProfUserId = userMap['professor@anubis.com'];
  if (!defaultProfUserId) {
    throw new Error('Default professor ID not found.');
  }

  // Get other professors from the DB to use as co-advisors
  const allProfs = await db
    .select({ id: professors.userId })
    .from(professors)
    .where(eq(professors.institution, 'UFC'))
    .limit(5);

  const coadvisorIds = allProfs.map(p => p.id).filter(id => id !== defaultProfUserId);

  const mockThemes = [
    {
      title: 'Inteligência Artificial na Saúde Pública',
      description:
        'Pesquisa voltada ao uso de Redes Neurais Convolucionais e Processamento de Linguagem Natural para automatização de triagem de prontuários médicos e predição de surtos de dengue na região metropolitana de Fortaleza.',
      vacancies: 2,
      level: 'masters' as const,
      references: [
        { name: 'AI in Medicine Handbook', url: 'https://example.com/handbook' },
        { name: 'Machine Learning for Health Spreads', url: 'https://example.com/health-ml' },
      ],
      associatedProfessorIds: coadvisorIds.slice(0, 2),
    },
    {
      title: 'Segurança e Escalabilidade em Blockchains baseadas em Proof of Stake',
      description:
        'Estudo analítico e prático de novos algoritmos de consenso para mitigar ataques de suborno de validadores e análise de técnicas de sharding para otimização do throughput transacional.',
      vacancies: 1,
      level: 'doctoral' as const,
      references: [{ name: 'PoS Security Models', url: 'https://example.com/pos-sec' }],
      associatedProfessorIds: coadvisorIds.slice(1, 3),
    },
    {
      title: 'Arquiteturas Serverless e Computação de Borda em IoT Industrial',
      description:
        'Este tema visa projetar e validar uma infraestrutura serverless de baixíssima latência para execução de tarefas de detecção de anomalias em sensores de esteiras industriais na borda da rede.',
      vacancies: 3,
      level: 'masters' as const,
      references: [],
      associatedProfessorIds: [],
    },
  ];

  for (const mockTheme of mockThemes) {
    const [existing] = await db
      .select()
      .from(researchThemes)
      .where(eq(researchThemes.title, mockTheme.title))
      .limit(1);

    if (existing) {
      console.log(`[INFO] Research theme "${mockTheme.title}" already exists.`);
      continue;
    }

    const [inserted] = await db
      .insert(researchThemes)
      .values({
        professorId: defaultProfUserId,
        title: mockTheme.title,
        description: mockTheme.description,
        vacancies: mockTheme.vacancies,
        level: mockTheme.level,
        references: mockTheme.references,
      })
      .returning();

    console.log(`[SUCCESS] Seeded research theme: ${mockTheme.title}`);

    if (mockTheme.associatedProfessorIds.length > 0) {
      await db
        .insert(researchThemeProfessors)
        .values(
          mockTheme.associatedProfessorIds.map(coId => ({
            researchThemeId: inserted.id,
            professorId: coId,
          })),
        )
        .onConflictDoNothing();
      console.log(
        `[SUCCESS] Associated ${mockTheme.associatedProfessorIds.length} co-advisors to: ${mockTheme.title}`,
      );
    }
  }
}

async function seedCvCategories(db: NodePgDatabase): Promise<void> {
  const openPeriods = await db
    .select()
    .from(enrollmentPeriods)
    .where(eq(enrollmentPeriods.status, 'open'));

  if (openPeriods.length === 0) {
    console.log('[INFO] No open enrollment periods found. Nothing to seed CV categories.');
    return;
  }

  for (const period of openPeriods) {
    const existing = await db
      .select({ id: cvScoringCategories.id })
      .from(cvScoringCategories)
      .where(eq(cvScoringCategories.enrollmentPeriodId, period.id))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[SKIP] Period "${period.name}" already has scoring categories.`);
      continue;
    }

    const allCategories = [
      { categories: Object.values(MASTERS_SECTIONS), level: 'masters' as const },
      { categories: Object.values(DOCTORAL_SECTIONS), level: 'doctoral' as const },
    ];

    let totalSeeded = 0;
    for (const { categories, level } of allCategories) {
      for (const cat of categories) {
        await db.insert(cvScoringCategories).values({
          enrollmentPeriodId: period.id,
          name: cat.name,
          description: cat.description,
          pointsPerItem: '0.00',
          maxPoints: cat.maxPoints.toString(),
          level,
          sortOrder: cat.sortOrder,
        });
      }
      totalSeeded += categories.length;
    }

    console.log(
      `[SUCCESS] Seeded ${totalSeeded} categories for "${period.name}" (masters + doctoral)`,
    );
  }
}

// ==========================================
// Main Execution
// ==========================================
async function main(): Promise<void> {
  console.log('[INFO] Starting database seeding process...');
  const pool = createDatabasePool();
  const db = drizzle(pool);

  try {
    // 1. Seed Professors (needed for Co-Advisors association)
    await seedProfessors(db);

    // 2. Seed Default Users & Themes
    await seedDefaultUsersAndThemes(db);

    // 3. Seed CV Categories
    await seedCvCategories(db);

    console.log('[SUCCESS] Database seeding completed successfully.');
  } catch (error) {
    console.error('[ERROR] Seeding process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('[INFO] Database connection pool closed.');
  }
}

main().catch(error => {
  console.error('[ERROR] Uncaught exception during seeding:', error);
  process.exit(1);
});
