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

  it('creates, updates and fetches a research theme with many-to-many associations', async () => {
    const ownerId = await createProfessor(db, undefined, 'Carlos', 'Oliveira');
    const assocId1 = await createProfessor(db, undefined, 'Ana', 'Silva');
    const assocId2 = await createProfessor(db, undefined, 'Bruno', 'Santos');

    const created = await repository.create({
      professorId: ownerId,
      title: 'IA e Computacao',
      description: 'Descricao',
      vacancies: 2,
      level: ResearchThemeLevelEnum.masters,
      references: [],
      associatedProfessorIds: [assocId1, assocId2],
    });

    const found = await repository.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.professorId).toBe(ownerId);
    expect(found?.professor?.firstName).toBe('Carlos');
    expect(found?.associatedProfessors).toHaveLength(2);
    const assocIds = found?.associatedProfessors?.map(p => p.id) ?? [];
    expect(assocIds).toContain(assocId1);
    expect(assocIds).toContain(assocId2);

    // Update associations
    await repository.update(created.id, {
      associatedProfessorIds: [assocId1],
    });

    const foundAfterUpdate = await repository.findById(created.id);
    expect(foundAfterUpdate?.associatedProfessors).toHaveLength(1);
    expect(foundAfterUpdate?.associatedProfessors?.[0]?.id).toBe(assocId1);
  });

  it('searches themes by title, description and professor names', async () => {
    const ownerId = await createProfessor(db, undefined, 'Gabriel', 'Castro');
    const otherId = await createProfessor(db, undefined, 'Maria', 'Sousa');

    await repository.create({
      professorId: ownerId,
      title: 'Drizzle ORM Advanced Techniques',
      description: 'Some desc',
      vacancies: 1,
      level: ResearchThemeLevelEnum.masters,
      references: [],
    });

    await repository.create({
      professorId: otherId,
      title: 'NestJS Framework',
      description: 'Learning NestJS',
      vacancies: 2,
      level: ResearchThemeLevelEnum.doctoral,
      references: [],
    });

    // Search by title
    const searchTitle = await repository.findAllByFilters({ search: 'drizzle' });
    expect(searchTitle.data).toHaveLength(1);
    expect(searchTitle.data[0]?.title).toBe('Drizzle ORM Advanced Techniques');

    // Search by description
    const searchDesc = await repository.findAllByFilters({ search: 'learning' });
    expect(searchDesc.data).toHaveLength(1);
    expect(searchDesc.data[0]?.title).toBe('NestJS Framework');

    // Search by owner name
    const searchOwner = await repository.findAllByFilters({ search: 'gabriel' });
    expect(searchOwner.data).toHaveLength(1);
    expect(searchOwner.data[0]?.title).toBe('Drizzle ORM Advanced Techniques');
  });

  it('returns correct total count and associations when filtering and paginating', async () => {
    const ownerId = await createProfessor(db, undefined, 'Owner', 'Professor');
    const assocId = await createProfessor(db, undefined, 'Assoc', 'Professor');

    // Create 3 themes
    await repository.create({
      professorId: ownerId,
      title: 'Deep Learning',
      description: 'AI details',
      vacancies: 1,
      level: ResearchThemeLevelEnum.masters,
      references: [],
      associatedProfessorIds: [assocId],
    });

    await repository.create({
      professorId: ownerId,
      title: 'Reinforcement Learning',
      description: 'AI details',
      vacancies: 2,
      level: ResearchThemeLevelEnum.masters,
      references: [],
      associatedProfessorIds: [],
    });

    await repository.create({
      professorId: ownerId,
      title: 'Web Security',
      description: 'Security details',
      vacancies: 3,
      level: ResearchThemeLevelEnum.doctoral,
      references: [],
    });

    // Find masters themes (2 items), paginate page 1 with limit 1
    const result = await repository.findAllByFilters({
      level: ResearchThemeLevelEnum.masters,
      page: 1,
      limit: 1,
    });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.data[0].associatedProfessors).toHaveLength(1);
    expect(result.data[0].associatedProfessors?.[0].id).toBe(assocId);
  });
});

async function createProfessor(
  db: TestDrizzleDB,
  id?: string,
  firstName?: string,
  lastName?: string,
): Promise<string> {
  const professorId = id ?? randomUUID();
  const [userRow] = await db
    .insert(users)
    .values({
      id: professorId,
      role: RoleEnum.professor,
      status: StatusEnum.active,
      firstName: firstName ?? 'Professor',
      lastName: lastName ?? 'Test',
      email: `${professorId}@example.com`,
    })
    .returning({ id: users.id });

  await db.insert(professors).values({
    userId: userRow.id,
    department: 'Departamento de Computacao',
    institution: 'UFC',
  });

  return userRow.id;
}
