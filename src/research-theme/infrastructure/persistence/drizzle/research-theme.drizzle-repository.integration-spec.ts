import type { DrizzleDB } from '@/database/drizzle.provider';
import { professors } from '@/database/schema/professor';
import { users } from '@/database/schema/users';
import {
  createTestDrizzle,
  truncateAllTables,
  type TestDrizzleDB,
} from '@/database/testing/integration-database';
import { ResearchThemeLevelEnum } from '@/research-theme/research-theme-level.enum';
import { RoleEnum } from '@/roles/roles.enum';
import { StatusEnum } from '@/statuses/statuses.enum';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ResearchThemeDrizzleRepository } from './research-theme.drizzle-repository';

describe('ResearchThemeDrizzleRepository (integration)', () => {
  let db: TestDrizzleDB;
  let pool: Pool;
  let repository: ResearchThemeDrizzleRepository;

  beforeAll(() => {
    const testDb = createTestDrizzle();
    db = testDb.db;
    pool = testDb.pool;
    repository = new ResearchThemeDrizzleRepository(db as unknown as DrizzleDB);
  });

  afterEach(async () => {
    await truncateAllTables(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates and fetches a research theme', async () => {
    const professorId = await createProfessor(db);
    const created = await repository.create({
      professorId,
      title: 'IA aplicada',
      description: 'Descricao do tema',
      vacancies: 2,
      level: ResearchThemeLevelEnum.masters,
      references: [{ name: 'Paper', url: 'https://example.com' }],
    });

    const found = await repository.findById(created.id);

    expect(found).toMatchObject({
      id: created.id,
      professorId,
      title: 'IA aplicada',
      level: ResearchThemeLevelEnum.masters,
    });
    expect(found?.references).toEqual([{ name: 'Paper', url: 'https://example.com' }]);
  });

  it('filters themes by level and professor', async () => {
    const professorId = await createProfessor(db);
    const otherProfessorId = await createProfessor(db);

    await repository.create({
      professorId,
      title: 'IA aplicada',
      description: 'Descricao do tema',
      vacancies: 1,
      level: ResearchThemeLevelEnum.masters,
      references: [],
    });
    await repository.create({
      professorId: otherProfessorId,
      title: 'Sistemas distribuidos',
      description: 'Descricao do tema',
      vacancies: 1,
      level: ResearchThemeLevelEnum.doctoral,
      references: [],
    });

    const byLevel = await repository.findAllByFilters({ level: ResearchThemeLevelEnum.masters });
    expect(byLevel.data).toHaveLength(1);
    expect(byLevel.data[0]?.professorId).toBe(professorId);

    const byProfessor = await repository.findAllByFilters({ professorId: otherProfessorId });
    expect(byProfessor.data).toHaveLength(1);
    expect(byProfessor.data[0]?.level).toBe(ResearchThemeLevelEnum.doctoral);
  });

  it('paginates theme list results', async () => {
    const professorId = await createProfessor(db);

    await repository.create({
      professorId,
      title: 'Tema 1',
      description: 'Descricao 1',
      vacancies: 1,
      level: ResearchThemeLevelEnum.masters,
      references: [],
    });
    await repository.create({
      professorId,
      title: 'Tema 2',
      description: 'Descricao 2',
      vacancies: 1,
      level: ResearchThemeLevelEnum.masters,
      references: [],
    });

    const pageOne = await repository.findAllByFilters({ page: 1, limit: 1 });
    const pageTwo = await repository.findAllByFilters({ page: 2, limit: 1 });

    expect(pageOne.data).toHaveLength(1);
    expect(pageTwo.data).toHaveLength(1);
    expect(pageOne.pagination.total).toBe(2);
    expect(pageOne.pagination.totalPages).toBe(2);
    expect(pageTwo.pagination.page).toBe(2);
  });
});

async function createProfessor(db: TestDrizzleDB, id?: string): Promise<string> {
  const professorId = id ?? randomUUID();
  const [userRow] = await db
    .insert(users)
    .values({
      id: professorId,
      role: RoleEnum.professor,
      status: StatusEnum.active,
    })
    .returning({ id: users.id });

  await db.insert(professors).values({
    userId: userRow.id,
    department: 'Departamento de Computacao',
    institution: 'UFC',
  });

  return userRow.id;
}
