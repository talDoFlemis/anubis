import { Test } from '@nestjs/testing';
import { ValidationService } from './validation.service';

import { DRIZZLE_TX } from '../database/drizzle.constants';
import type { DrizzleDB } from '../database/drizzle.provider';
import { RoleEnum } from '../roles/roles.enum';
import type { User } from '../users/domain/user';

describe('ValidationService', () => {
  let service: ValidationService;
  let mockDb: DrizzleDB;

  const mockDbResults = [
    {
      enrollmentId: 'enrollment-1',
      candidateFirstName: 'John',
      candidateLastName: 'Doe',
      candidateEmail: 'john@example.com',
      themeName: 'AI Research',
      professorFirstName: 'Jane',
      professorLastName: 'Smith',
      level: 'masters',
      declaredScore: '15.50',
      validatedScore: '14.00',
      submittedAt: new Date('2026-06-25T00:00:00.000Z'),
      primaryThemeId: 'theme-1',
      secondaryThemeId: null,
      totalItems: 2,
      verifiedItems: 2,
    },
    {
      enrollmentId: 'enrollment-2',
      candidateFirstName: 'Jane',
      candidateLastName: 'Doe',
      candidateEmail: 'jane@example.com',
      themeName: null,
      professorFirstName: null,
      professorLastName: null,
      level: 'masters',
      declaredScore: '0.00',
      validatedScore: null,
      submittedAt: new Date('2026-06-25T01:00:00.000Z'),
      primaryThemeId: null,
      secondaryThemeId: null,
      totalItems: 1,
      verifiedItems: 0,
    },
    {
      enrollmentId: 'enrollment-3',
      candidateFirstName: 'Bob',
      candidateLastName: 'Smith',
      candidateEmail: 'bob@example.com',
      themeName: 'Systems Research',
      professorFirstName: 'Bob',
      professorLastName: 'Jones',
      level: 'doctoral',
      declaredScore: '9.00',
      validatedScore: '9.00',
      submittedAt: new Date('2026-06-25T02:00:00.000Z'),
      primaryThemeId: 'theme-2',
      secondaryThemeId: null,
      totalItems: 1,
      verifiedItems: 1,
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
      const queryBuilder = createQueryBuilder(mockDbResults);
      (mockDb.select as jest.Mock).mockReturnValue(queryBuilder);

      const mockUser = {
        id: 'user-1',
        role: RoleEnum.mdccSecretary,
      } as User;

      // Act
      const result = await service.getCandidatesForDashboard(mockUser);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        enrollmentId: 'enrollment-1',
        candidateName: 'John Doe',
        candidateEmail: 'john@example.com',
        themeName: 'AI Research',
        professorName: 'Jane Smith',
        level: 'masters',
        declaredScore: 15.5,
        validatedScore: 14.0,
        status: 'completed',
      });
      expect(result[1]).toMatchObject({
        enrollmentId: 'enrollment-2',
        candidateName: 'Jane Doe',
        candidateEmail: 'jane@example.com',
        themeName: 'Nenhum',
        professorName: undefined,
        level: 'masters',
        declaredScore: 0.0,
        validatedScore: null,
        status: 'pending',
      });
      expect(result[2]).toMatchObject({
        enrollmentId: 'enrollment-3',
        candidateName: 'Bob Smith',
        candidateEmail: 'bob@example.com',
        themeName: 'Systems Research',
        professorName: 'Bob Jones',
        level: 'doctoral',
        declaredScore: 9.0,
        validatedScore: 9.0,
        status: 'completed',
      });
    });
  });

  describe('getValidationStats', () => {
    it('should return total, validated, and pending counts', async () => {
      const queryBuilder = createQueryBuilder(mockDbResults);
      (mockDb.select as jest.Mock).mockReturnValue(queryBuilder);

      // Act
      const result = await service.getValidationStats();

      // Assert
      expect(result).toEqual({
        total: 3,
        validated: 2,
        pending: 1,
        inProgress: 0,
      });
    });
  });
});
