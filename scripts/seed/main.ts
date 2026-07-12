/* eslint-disable no-console */
import * as bcrypt from 'bcrypt';
import { eq, inArray } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  DOCTORAL_SECTIONS,
  MASTERS_SECTIONS,
} from '../../src/cv-scoring/constants/cv-scoring-config';
import { candidates } from '../../src/database/schema/candidates';
import { cvItems } from '../../src/database/schema/cv-items';
import { cvScoringCategories } from '../../src/database/schema/cv-scoring';
import { enrollmentPeriods } from '../../src/database/schema/enrollment-periods';
import { enrollments } from '../../src/database/schema/enrollments';
import { files } from '../../src/database/schema/files';
import { professors } from '../../src/database/schema/professor';

import { interviewEvaluations } from '../../src/database/schema/interview-evaluations';

import { projectEvaluations } from '../../src/database/schema/project-evaluations';

import { classifications } from '../../src/database/schema/classifications';
import { researchThemeProfessors, researchThemes } from '../../src/database/schema/research-themes';
import { users } from '../../src/database/schema/users';

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

interface InterviewScoreItem {
  decisionMaking: string;
  problemAnalysis: string;
  oralCommunication: string;
  researchWork: string;
  technicalKnowledge: string;
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
  let openPeriods = await db
    .select()
    .from(enrollmentPeriods)
    .where(eq(enrollmentPeriods.status, 'open'));

  if (openPeriods.length === 0) {
    const [inserted] = await db
      .insert(enrollmentPeriods)
      .values({
        name: 'Seleção MDCC 2026.1',
        semester: '2026.1',
        startDate: new Date('2026-01-01T00:00:00Z'),
        endDate: new Date('2026-12-31T23:59:59Z'),
        status: 'open',
      })
      .returning();
    openPeriods = [inserted];
    console.log(`[SUCCESS] Seeded new open enrollment period: ${inserted.name}`);
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

async function seedSampleCandidates(db: NodePgDatabase): Promise<void> {
  console.log('[INFO] Seeding sample candidates for existing themes...');

  const openPeriods = await db
    .select()
    .from(enrollmentPeriods)
    .where(eq(enrollmentPeriods.status, 'open'))
    .limit(1);

  if (openPeriods.length === 0) {
    console.log('[WARN] No open enrollment period found. Skipping sample candidates seed.');
    return;
  }
  const period = openPeriods[0];

  const themes = await db.select().from(researchThemes);
  if (themes.length === 0) {
    console.log('[WARN] No research themes found. Skipping sample candidates seed.');
    return;
  }

  const hash = await bcrypt.hash('senha123', 10);
  let fileCount = 1;
  let cpfCounter = 10000000001;

  for (const theme of themes) {
    console.log(`[INFO] Seeding 3 candidates for theme: "${theme.title}" (${theme.level})`);

    for (let i = 1; i <= 3; i++) {
      const email = `candidate.${theme.id.slice(0, 8)}.${i}@anubis.com`;

      // 1. Insert user
      const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      let userId = existingUser?.id;
      if (!userId) {
        const [insertedUser] = await db
          .insert(users)
          .values({
            authProvider: 'email',
            providerSubject: email,
            email,
            password: hash,
            cpf: String(cpfCounter++),
            firstName: `Candidato ${i}`,
            lastName: `Tema ${theme.id.slice(0, 4)}`,
            role: 'candidate',
            status: 'active',
            onboardingCompleted: true,
            mustChangePassword: false,
          })
          .returning();
        userId = insertedUser.id;
      }

      // 2. Insert candidate profile
      await db.insert(candidates).values({ userId }).onConflictDoNothing();

      // 3. Create dummy file records
      const undergradProofId = `22222222-2222-2222-2222-${String(fileCount++).padStart(12, '0')}`;
      await db
        .insert(files)
        .values({
          id: undergradProofId,
          originalName: `historico_graduacao_${i}.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: 204857,
          bucket: 'anubis-bucket',
          key: `dummy-undergrad-${userId}`,
          uploadedBy: userId,
          purpose: 'proof',
        })
        .onConflictDoNothing();

      const sigaaReceiptId = `33333333-3333-3333-3333-${String(fileCount++).padStart(12, '0')}`;
      await db
        .insert(files)
        .values({
          id: sigaaReceiptId,
          originalName: `comprovante_sigaa_${i}.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: 153041,
          bucket: 'anubis-bucket',
          key: `dummy-sigaa-${userId}`,
          uploadedBy: userId,
          purpose: 'proof',
          // eslint-disable-next-line prettier/prettier
        })
        .onConflictDoNothing();

      let projectFileId: string | undefined = undefined;
      if (theme.level === 'doctoral') {
        projectFileId = `44444444-4444-4444-4444-${String(fileCount++).padStart(12, '0')}`;
        await db
          .insert(files)
          .values({
            id: projectFileId,
            originalName: `projeto_pesquisa_${i}.pdf`,
            mimeType: 'application/pdf',
            sizeBytes: 1048576,
            bucket: 'anubis-bucket',
            key: `dummy-project-${userId}`,
            uploadedBy: userId,
            purpose: 'proof',
          })
          .onConflictDoNothing();
      }

      // 4. Create enrollment (if not exists)
      const [existingEnrollment] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.candidateId, userId))
        .limit(1);

      let enrollmentId = existingEnrollment?.id;
      if (!enrollmentId) {
        const [insertedEnrollment] = await db
          .insert(enrollments)
          .values({
            candidateId: userId,
            enrollmentPeriodId: period.id,
            level: theme.level,
            status: 'submitted',
            undergradUniversity: i === 1 ? 'UFC' : i === 2 ? 'UECE' : 'IFCE',
            undergradCourse: 'Ciência da Computação',
            undergradDegreeType: 'bacharelado',
            ira: (7.5 + i * 0.5).toFixed(2),
            undergradProofFileId: undergradProofId,
            phone: '85999999999',
            justification: 'Quero muito fazer pós-graduação.',
            sigaaCode: `SIGAA-2026-${theme.id.slice(0, 4)}-${i}`,
            sigaaReceiptFileId: sigaaReceiptId,
            declaration: true,
            primaryThemeId: theme.id,
            poscomp: {
              hasPoscomp: i % 2 === 0,
              year: 2025,
              mathScore: 10 + i,
              fundamentalsScore: 15 + i,
              technologyScore: 20 + i,
              receiptFileId:
                i % 2 === 0
                  ? `55555555-5555-5555-5555-${String(fileCount++).padStart(12, '0')}`
                  : undefined,
            },
            projectTitle:
              theme.level === 'doctoral' ? `Proposta de Pesquisa em ${theme.title}` : undefined,
            projectFileId: projectFileId,
            submittedAt: new Date(),
          })
          .returning();
        enrollmentId = insertedEnrollment.id;

        // Also if we generated a poscomp receipt file, seed it
        if (insertedEnrollment.poscomp?.receiptFileId) {
          await db
            .insert(files)
            .values({
              id: insertedEnrollment.poscomp.receiptFileId,
              originalName: `comprovante_poscomp_${i}.pdf`,
              mimeType: 'application/pdf',
              sizeBytes: 102400,
              bucket: 'anubis-bucket',
              key: `dummy-poscomp-${userId}`,
              uploadedBy: userId,
              purpose: 'proof',
            })
            .onConflictDoNothing();
        }
      }

      // 5. Seed some CV items
      const categories = await db
        .select()
        .from(cvScoringCategories)
        .where(eq(cvScoringCategories.enrollmentPeriodId, period.id));

      if (categories.length > 0) {
        // Let's pick 2 categories to add CV items to
        const selectedCats = categories.filter(c => c.level === theme.level).slice(0, 2);

        let totalDraftScore = 0;
        for (const cat of selectedCats) {
          const itemProofId = `66666666-6666-6666-6666-${String(fileCount++).padStart(12, '0')}`;
          await db
            .insert(files)
            .values({
              id: itemProofId,
              originalName: `comprovante_${cat.name.toLowerCase().replace(/ /g, '_')}.pdf`,
              mimeType: 'application/pdf',
              sizeBytes: 45023,
              bucket: 'anubis-bucket',
              key: `dummy-cvitem-${enrollmentId}`,
              uploadedBy: userId,
              purpose: 'proof',
            })
            .onConflictDoNothing();

          const ptsPerItem = parseFloat(cat.pointsPerItem) || 1.5;
          const qty = 2;
          const score = ptsPerItem * qty;
          totalDraftScore += score;

          await db
            .insert(cvItems)
            .values({
              enrollmentId,
              scoringCategoryId: cat.id,
              description: `Experiência de pesquisa na categoria ${cat.name}`,
              quantity: qty,
              proofFileId: itemProofId,
              score: score.toString(),
              isVerified: 'pending',
            })
            .onConflictDoNothing();
        }

        // Update total score on the enrollment
        await db
          .update(enrollments)
          .set({ scoreDraft: totalDraftScore.toString() })
          .where(eq(enrollments.id, enrollmentId));
      }
    }
  }

  console.log('[SUCCESS] Seed of sample candidates completed.');
}

async function seedEvaluationsAndClassifications(db: NodePgDatabase): Promise<void> {
  console.log('[INFO] Seeding evaluations and classifications...');

  const profUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, 'professor'))
    .limit(3);

  if (profUsers.length === 0) {
    console.log('[WARN] No professors found. Skipping evaluations.');
    return;
  }

  const submittedEnrollments = await db
    .select({
      enrollmentId: enrollments.id,
      candidateId: enrollments.candidateId,
      level: enrollments.level,
      ira: enrollments.ira,
      primaryThemeId: enrollments.primaryThemeId,
      secondaryThemeId: enrollments.secondaryThemeId,
    })
    .from(enrollments)
    .where(eq(enrollments.status, 'submitted'));

  if (submittedEnrollments.length === 0) {
    console.log('[WARN] No submitted enrollments found. Skipping evaluations.');
    return;
  }

  console.log('[INFO] Found ' + submittedEnrollments.length + ' enrollments.');

  let interviewCount = 0;
  let projectCount = 0;
  let classificationCount = 0;

  for (const enrollment of submittedEnrollments) {
    const ira = parseFloat(enrollment.ira || '7.5');

    await db
      .update(enrollments)
      .set({ scoreValidated: '30.00' })
      .where(eq(enrollments.id, enrollment.enrollmentId));

    const evaluators = profUsers.slice(0, Math.min(2, profUsers.length));
    const interviewScores: InterviewScoreItem[] = [];

    for (const evaluator of evaluators) {
      const scores = {
        decisionMaking: (6 + Math.random() * 4).toFixed(2),
        problemAnalysis: (7 + Math.random() * 3).toFixed(2),
        oralCommunication: (7 + Math.random() * 3).toFixed(2),
        researchWork: (6 + Math.random() * 4).toFixed(2),
        technicalKnowledge: (7 + Math.random() * 3).toFixed(2),
      };

      await db
        .insert(interviewEvaluations)
        .values({
          candidateId: enrollment.candidateId,
          evaluatorId: evaluator.id,
          ...scores,
          observations: 'Avaliacao gerada automaticamente pelo seed.',
        })
        .onConflictDoNothing();

      interviewScores.push(scores);
      interviewCount++;
    }

    const avgInterview =
      interviewScores.length > 0
        ? (
            interviewScores.reduce(function (sum, s) {
              const vals = [
                s.decisionMaking,
                s.problemAnalysis,
                s.oralCommunication,
                s.researchWork,
                s.technicalKnowledge,
              ];
              const avg =
                vals.reduce(function (a, b) {
                  return a + parseFloat(b);
                }, 0) / vals.length;
              return sum + avg;
            }, 0) / interviewScores.length
          ).toFixed(2)
        : '0.00';

    let projectScore = '0.00';
    if (enrollment.level === 'doctoral') {
      for (const evaluator of evaluators) {
        const projScores = {
          criterion1: (7 + Math.random() * 3).toFixed(2),
          criterion2: (6 + Math.random() * 4).toFixed(2),
          criterion3: (7 + Math.random() * 3).toFixed(2),
          criterion4: (6 + Math.random() * 4).toFixed(2),
          criterion5: (7 + Math.random() * 3).toFixed(2),
        };

        await db
          .insert(projectEvaluations)
          .values({
            candidateId: enrollment.candidateId,
            evaluatorId: evaluator.id,
            ...projScores,
            observations: 'Projeto avaliado automaticamente pelo seed.',
          })
          .onConflictDoNothing();

        projectScore = (
          (parseFloat(projScores.criterion1) +
            parseFloat(projScores.criterion2) +
            parseFloat(projScores.criterion3) +
            parseFloat(projScores.criterion4) +
            parseFloat(projScores.criterion5)) /
          5
        ).toFixed(2);
        projectCount++;
      }
    }

    // Calculate final score using formula
    const CV_MAX = 40;
    const cvScore = 30;
    const normalizedCv = Math.min(cvScore / CV_MAX, 1);
    const interviewNum = parseFloat(avgInterview);
    const projectNum = parseFloat(projectScore);

    let finalScore;
    if (enrollment.level === 'masters') {
      finalScore = 0.3 * ira + 0.4 * normalizedCv * 10 + 0.3 * interviewNum;
    } else {
      finalScore = 0.25 * ira + 0.3 * normalizedCv * 10 + 0.25 * interviewNum + 0.2 * projectNum;
    }
    finalScore = Math.max(0, Math.min(10, Number(finalScore.toFixed(2))));

    const stage = enrollment.level === 'masters' ? 'mestrado' : 'doutorado';

    // Create classification for primary theme
    if (enrollment.primaryThemeId) {
      await db
        .insert(classifications)
        .values({
          candidateId: enrollment.candidateId,
          researchThemeId: enrollment.primaryThemeId,
          ira: ira.toFixed(2),
          interviewScore: avgInterview,
          cvScore: cvScore.toFixed(2),
          projectScore: enrollment.level === 'doctoral' ? projectScore : null,
          finalScore: finalScore.toFixed(2),
          rank: 0,
          stage,
        })
        .onConflictDoNothing();
      classificationCount++;
    }

    // Create classification for secondary theme (if any)
    if (enrollment.secondaryThemeId) {
      await db
        .insert(classifications)
        .values({
          candidateId: enrollment.candidateId,
          researchThemeId: enrollment.secondaryThemeId,
          ira: ira.toFixed(2),
          interviewScore: avgInterview,
          cvScore: cvScore.toFixed(2),
          projectScore: enrollment.level === 'doctoral' ? projectScore : null,
          finalScore: finalScore.toFixed(2),
          rank: 0,
          stage,
          // eslint-disable-next-line prettier/prettier
        })
        .onConflictDoNothing();
      classificationCount++;
    }
  }

  const allClassifications = await db
    .select()
    .from(classifications)
    .where(
      inArray(
        classifications.candidateId,
        submittedEnrollments.map(function (e) {
          return e.candidateId;
        }),
      ),
    );

  const groups = new Map<string, typeof allClassifications>();
  for (const cls of allClassifications) {
    const _key = cls.researchThemeId + '-' + cls.stage;
    if (!groups.has(_key)) groups.set(_key, []);
    groups.get(_key)!.push(cls);
  }

  for (const [, group] of groups) {
    const sorted = group.sort(function (a, b) {
      const finalDiff = Number(b.finalScore) - Number(a.finalScore);
      if (finalDiff !== 0) return finalDiff;
      const interviewDiff = Number(b.interviewScore) - Number(a.interviewScore);
      if (interviewDiff !== 0) return interviewDiff;
      const projectDiff = Number(b.projectScore || 0) - Number(a.projectScore || 0);
      if (projectDiff !== 0) return projectDiff;
      return Number(b.cvScore) - Number(a.cvScore);
    });

    for (let idx = 0; idx < sorted.length; idx++) {
      await db
        .update(classifications)
        .set({ rank: idx + 1 })
        .where(eq(classifications.id, sorted[idx].id));
    }
  }

  console.log(
    `[SUCCESS] Seeded ${interviewCount} interviews, ${projectCount} project evals, ${classificationCount} classifications.`,
  );
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

    // 4. Seed sample candidates for development QoL
    await seedSampleCandidates(db);

    // 5. Seed evaluations and classifications
    await seedEvaluationsAndClassifications(db);

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
