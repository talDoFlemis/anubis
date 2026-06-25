import { Test } from '@nestjs/testing';
import { ValidationService } from './validation.service';

import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';

describe('ValidationService', () => {
  let service: ValidationService;
  let mockDb: DrizzleDB;

  const mockEnrollments = [
    {
      id: 'enrollment-1',
      candidateId: 'candidate-1',
      undergradUniversity: 'University A',
      ira: 8.5,
      status: 'submitted',
      primaryThemeId: 'theme-1',
      createdAt: new Date(),
    },
    {
      id: 'enrollment-2',
      candidateId: 'candidate-2',
      undergradUniversity: 'University B',
      ira: 7.0,
      status: 'draft',
      primaryThemeId: null,
      createdAt: new Date(),
    },
    {
      id: 'enrollment-3',
      candidateId: 'candidate-3',
      undergradUniversity: 'University C',
      ira: 9.0,
      status: 'closed',
      primaryThemeId: 'theme-2',
      createdAt: new Date(),
    },
  ];

  const mockCandidates = [
    {
      id: 'candidate-1',
      userId: 'user-1',
      universityOfOrigin: 'University A',
      ira: 8.5,
      poscomp: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'candidate-2',
      userId: 'user-2',
      universityOfOrigin: 'University B',
      ira: 7.0,
      poscomp: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'candidate-3',
      userId: 'user-3',
      universityOfOrigin: 'University C',
      ira: 9.0,
      poscomp: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCvItems = [
    {
      id: 'cvitem-1',
      enrollmentId: 'enrollment-1',
      score: 8.5,
    },
    {
      id: 'cvitem-2',
      enrollmentId: 'enrollment-1',
      score: 7.0,
    },
    {
      id: 'cvitem-3',
      enrollmentId: 'enrollment-2',
      score: null,
    },
    {
      id: 'cvitem-4',
      enrollmentId: 'enrollment-3',
      score: 9.0,
    },
  ];

  const mockResearchThemes = [
    {
      id: 'theme-1',
      title: 'AI Research',
      level: 'masters',
      professorId: 'prof-1',
      vacancies: 2,
      references: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'theme-2',
      title: 'Systems Research',
      level: 'doctoral',
      professorId: 'prof-2',
      vacancies: 1,
      references: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  function createQueryBuilder(data: unknown) {
    return {
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => void) => resolve(data),
    };
  }

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
    } as unknown as DrizzleDB;

    const module = await Test.createTestingModule({
      providers: [
        ValidationService,
        {
          provide: DRIZZLE_TX,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  describe('getCandidatesForDashboard', () => {
    it('should return enrollments with summed scores and research theme info', async () => {
      // Prepare expected result
      const expected = mockEnrollments
        .map(e => {
          const candidate = mockCandidates.find(c => c.id === e.candidateId);
          const cvItemScores = mockCvItems
            .filter(ci => ci.enrollmentId === e.id)
            .map(ci => ci.score)
            .filter(s => s !== null);
          const totalScore = cvItemScores.reduce((sum, s) => sum + s, 0);
          const theme = mockResearchThemes.find(t => t.id === e.primaryThemeId);
          return {
            enrollmentId: e.id,
            candidateId: e.candidateId,
            university: candidate?.universityOfOrigin ?? null,
            ira: candidate?.ira ?? null,
            status: e.status,
            totalScore,
            researchThemeTitle: theme?.title ?? null,
            researchThemeLevel: theme?.level ?? null,
          };
        })
        .filter(r => r !== undefined);

      const queryBuilder = createQueryBuilder(expected);
      (mockDb.select as jest.Mock).mockReturnValue(queryBuilder);

      // Act
      const result = await service.getCandidatesForDashboard();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        enrollmentId: 'enrollment-1',
        totalScore: 15.5, // 8.5 + 7.0
        researchThemeTitle: 'AI Research',
        researchThemeLevel: 'masters',
      });
      expect(result[1]).toMatchObject({
        enrollmentId: 'enrollment-2',
        totalScore: 0, // null treated as 0
        researchThemeTitle: null,
        researchThemeLevel: null,
      });
      expect(result[2]).toMatchObject({
        enrollmentId: 'enrollment-3',
        totalScore: 9.0,
        researchThemeTitle: 'Systems Research',
        researchThemeLevel: 'doctoral',
      });
    });
  });

  describe('getValidationStats', () => {
    it('should return total, validated, and pending counts', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createQueryBuilder([{ count: 3 }])) // total
        .mockReturnValueOnce(createQueryBuilder([{ count: 2 }])) // validated
        .mockReturnValueOnce(createQueryBuilder([{ count: 1 }])); // pending

      // Act
      const result = await service.getValidationStats();

      // Assert
      expect(result).toEqual({
        total: 3,
        validated: 2,
        pending: 1,
      });
    });
  });
});
