/* eslint-disable no-console */
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { users } from '../../src/database/schema/users';
import { professors } from '../../src/database/schema/professor';
import { researchThemes, researchThemeProfessors } from '../../src/database/schema/research-themes';

interface DefaultUserData {
  email: string;
  role: 'candidate' | 'professor' | 'mdcc-secretary' | 'post-graduate-coordinator' | 'post-graduate-vice-coordinator';
  firstName: string;
  lastName: string;
}

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

async function seedDefaultUsers(db: NodePgDatabase, passwordHash: string): Promise<Record<string, string>> {
  console.log('[INFO] Seeding default users...');
  const userMap: Record<string, string> = {};

  for (const defaultUser of DEFAULT_USERS) {
    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, defaultUser.email))
      .limit(1);

    if (existing) {
      console.log(`[INFO] User ${defaultUser.email} already exists.`);
      userMap[defaultUser.email] = existing.id;
      continue;
    }

    // Insert user
    const [inserted] = await db
      .insert(users)
      .values({
        authProvider: 'email',
        providerSubject: defaultUser.email,
        email: defaultUser.email,
        password: passwordHash,
        cpf: defaultUser.email.startsWith('candidate') ? '00000000001' : defaultUser.email.startsWith('professor') ? '00000000002' : defaultUser.email.startsWith('secretary') ? '00000000003' : defaultUser.email.startsWith('coordinator') ? '00000000004' : '00000000005',
        firstName: defaultUser.firstName,
        lastName: defaultUser.lastName,
        role: defaultUser.role,
        status: 'active',
        onboardingCompleted: true,
        mustChangePassword: false,
      })
      .returning();

    console.log(`[SUCCESS] Seeded default user: ${defaultUser.email}`);
    userMap[defaultUser.email] = inserted.id;

    // If professor role, seed the professor details table
    if (defaultUser.role === 'professor') {
      await db
        .insert(professors)
        .values({
          userId: inserted.id,
          department: 'Metodologias e Técnicas de Computação',
          institution: 'UFC',
        })
        .onConflictDoNothing();
    }
  }

  return userMap;
}

async function seedResearchThemes(db: NodePgDatabase, userMap: Record<string, string>): Promise<void> {
  console.log('[INFO] Seeding research themes...');
  const professorId = userMap['professor@anubis.com'];
  if (!professorId) {
    throw new Error('Default professor ID not found.');
  }

  // Get other professors from the DB if they exist to use as co-advisors
  const allProfs = await db
    .select({ id: professors.userId })
    .from(professors)
    .where(eq(professors.institution, 'UFC'))
    .limit(5);

  const coadvisorIds = allProfs.map(p => p.id).filter(id => id !== professorId);

  const mockThemes = [
    {
      title: 'Inteligência Artificial na Saúde Pública',
      description: 'Pesquisa voltada ao uso de Redes Neurais Convolucionais e Processamento de Linguagem Natural para automatização de triagem de prontuários médicos e predição de surtos de dengue na região metropolitana de Fortaleza.',
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
      description: 'Estudo analítico e prático de novos algoritmos de consenso para mitigar ataques de suborno de validadores e análise de técnicas de sharding para otimização do throughput transacional.',
      vacancies: 1,
      level: 'doctoral' as const,
      references: [
        { name: 'PoS Security Models', url: 'https://example.com/pos-sec' },
      ],
      associatedProfessorIds: coadvisorIds.slice(1, 3),
    },
    {
      title: 'Arquiteturas Serverless e Computação de Borda em IoT Industrial',
      description: 'Este tema visa projetar e validar uma infraestrutura serverless de baixíssima latência para execução de tarefas de detecção de anomalias em sensores de esteiras industriais na borda da rede.',
      vacancies: 3,
      level: 'masters' as const,
      references: [],
      associatedProfessorIds: [],
    },
  ];

  for (const mockTheme of mockThemes) {
    // Check if theme with same title already exists
    const [existing] = await db
      .select()
      .from(researchThemes)
      .where(eq(researchThemes.title, mockTheme.title))
      .limit(1);

    if (existing) {
      console.log(`[INFO] Research theme "${mockTheme.title}" already exists.`);
      continue;
    }

    // Insert theme
    const [inserted] = await db
      .insert(researchThemes)
      .values({
        professorId,
        title: mockTheme.title,
        description: mockTheme.description,
        vacancies: mockTheme.vacancies,
        level: mockTheme.level,
        references: mockTheme.references,
      })
      .returning();

    console.log(`[SUCCESS] Seeded research theme: ${mockTheme.title}`);

    // Insert associations
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
      console.log(`[SUCCESS] Associated ${mockTheme.associatedProfessorIds.length} co-advisors to: ${mockTheme.title}`);
    }
  }
}

async function main(): Promise<void> {
  const pool = createDatabasePool();
  const db = drizzle(pool);

  try {
    console.log('[INFO] Seeding database...');
    const hash = await bcrypt.hash('senha123', 10);
    const userMap = await seedDefaultUsers(db, hash);
    await seedResearchThemes(db, userMap);
    console.log('[SUCCESS] Database seeding process completed successfully.');
  } catch (error) {
    console.error('[ERROR] Seeding process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error('[ERROR] Uncaught exception during seed:', error);
  process.exit(1);
});
