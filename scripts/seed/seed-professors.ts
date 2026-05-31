/* eslint-disable no-console */
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { professors } from '../../src/database/schema/professor';
import { users } from '../../src/database/schema/users';

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

/**
 * Generates deterministic mock professor payloads scaled to a target size.
 *
 * @param count - Total number of records to generate.
 * @returns Array of structured professor inputs.
 *
 * @example
 * const records = generateMockProfessors(14);
 */
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

/**
 * Initializes the Postgres database connection pool based on environment configurations.
 */
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

/**
 * Inserts a single professor and their corresponding user record safely.
 */
async function seedProfessor(
  tx: Parameters<Parameters<NodePgDatabase['transaction']>[0]>[0],
  prof: GeneratedProfessorData,
): Promise<void> {
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

  const userRow = Array.isArray(rows) ? rows[0] : null;

  if (!userRow) {
    console.warn(
      `[WARN] Skipping profile insertion: User conflict or omission occurred for email: ${prof.email}`,
    );
    return;
  }

  await tx
    .insert(professors)
    .values({
      userId: userRow.id,
      department: prof.department,
      institution: prof.institution,
    })
    .onConflictDoNothing({ target: professors.userId });
}

/**
 * Executes the database seed execution for application professors.
 */
async function seed(): Promise<void> {
  const pool = createDatabasePool();
  const db = drizzle(pool);

  try {
    const generatedProfessors = generateMockProfessors(14);
    console.log(`[INFO] Starting insertion of ${generatedProfessors.length} mock professors.`);

    await db.transaction(async tx => {
      for (const prof of generatedProfessors) {
        await seedProfessor(tx, prof);
      }
    });

    console.log('[SUCCESS] Professors seed completed successfully.');
  } catch (error) {
    console.error(
      '[ERROR] Critical database seeding execution failure:',
      error instanceof Error ? error.message : error,
    );
    throw error;
  } finally {
    await pool.end();
  }
}

seed().catch(error => {
  console.error(
    '[ERROR] Process terminated prematurely due to unhandled seeding exception:',
    error,
  );
  process.exit(1);
});
