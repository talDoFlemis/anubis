import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { DRIZZLE_TX } from '../database/drizzle.constants';
import { UniversityService } from './university.service';

describe('UniversityService', () => {
  let service: UniversityService;
  let mockDb: any;

  const mockUniversity = {
    id: 'uni-uuid',
    name: 'Universidade Federal do Ceará',
    abbreviation: 'UFC',
    state: 'CE',
    city: 'Fortaleza',
    isManual: false,
    createdAt: new Date(),
  };

  const mockCourse = {
    id: 'course-uuid',
    name: 'Ciência da Computação',
    universityId: 'uni-uuid',
    isManual: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockUniversity]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockUniversity]),
    };

    const module = await Test.createTestingModule({
      providers: [UniversityService, { provide: DRIZZLE_TX, useValue: mockDb }],
    }).compile();

    service = module.get<UniversityService>(UniversityService);
  });

  describe('searchUniversities', () => {
    it('returns matching results', async () => {
      const results = await service.searchUniversities('UFC');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(results).toEqual([mockUniversity]);
    });

    it('returns empty array when no results match', async () => {
      mockDb.limit = jest.fn().mockResolvedValue([]);

      const results = await service.searchUniversities('NonExistent');

      expect(results).toEqual([]);
    });

    it('respects custom limit', async () => {
      await service.searchUniversities('UFC', 5);

      expect(mockDb.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('findUniversityById', () => {
    it('returns university when found', async () => {
      const result = await service.findUniversityById('uni-uuid');

      expect(result).toEqual(mockUniversity);
    });

    it('throws NotFoundException when not found', async () => {
      mockDb.limit = jest.fn().mockResolvedValue([]);

      await expect(service.findUniversityById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUniversity', () => {
    it('creates university with isManual=true', async () => {
      const dto = {
        name: 'Nova Universidade',
        abbreviation: 'NU',
        state: 'SP',
        city: 'São Paulo',
      };

      await service.createUniversity(dto);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        ...dto,
        isManual: true,
      });
    });
  });

  describe('searchCourses', () => {
    it('returns matching results', async () => {
      mockDb.limit = jest.fn().mockResolvedValue([mockCourse]);

      const results = await service.searchCourses('Ciência');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(results).toEqual([mockCourse]);
    });

    it('returns empty array when no results match', async () => {
      mockDb.limit = jest.fn().mockResolvedValue([]);

      const results = await service.searchCourses('NonExistent');

      expect(results).toEqual([]);
    });
  });

  describe('findCourseById', () => {
    it('returns course when found', async () => {
      mockDb.limit = jest.fn().mockResolvedValue([mockCourse]);

      const result = await service.findCourseById('course-uuid');

      expect(result).toEqual(mockCourse);
    });

    it('throws NotFoundException when not found', async () => {
      mockDb.limit = jest.fn().mockResolvedValue([]);

      await expect(service.findCourseById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCourse', () => {
    it('creates course with isManual=true', async () => {
      mockDb.returning = jest.fn().mockResolvedValue([mockCourse]);

      const dto = {
        name: 'Engenharia de Software',
        universityId: 'uni-uuid',
      };

      await service.createCourse(dto);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        ...dto,
        isManual: true,
      });
    });
  });
});
