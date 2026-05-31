import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { UniversityRepository } from './infrastructure/persistence/university.repository';
import { UniversityService } from './university.service';

describe('UniversityService', () => {
  let service: UniversityService;
  let mockRepository: jest.Mocked<UniversityRepository>;

  const mockUniversity = {
    id: 'uni-uuid',
    name: 'Universidade Federal do Ceará',
    abbreviation: 'UFC',
    state: 'CE',
    city: 'Fortaleza',
    isManual: false,
    createdAt: new Date(),
    searchVector: '',
  };

  const mockCourse = {
    id: 'course-uuid',
    name: 'Ciência da Computação',
    universityId: 'uni-uuid',
    isManual: false,
    createdAt: new Date(),
    searchVector: '',
  };

  beforeEach(async () => {
    mockRepository = {
      searchUniversities: jest.fn().mockResolvedValue([mockUniversity]),
      searchCourses: jest.fn().mockResolvedValue([mockCourse]),
      findUniversityById: jest.fn().mockResolvedValue(mockUniversity),
      findCourseById: jest.fn().mockResolvedValue(mockCourse),
      createUniversity: jest.fn().mockResolvedValue(mockUniversity),
      createCourse: jest.fn().mockResolvedValue(mockCourse),
    };

    const module = await Test.createTestingModule({
      providers: [UniversityService, { provide: UniversityRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<UniversityService>(UniversityService);
  });

  describe('searchUniversities', () => {
    it('returns matching results', async () => {
      const results = await service.searchUniversities('UFC');

      expect(mockRepository.searchUniversities).toHaveBeenCalledWith('UFC', 20);
      expect(results).toEqual([mockUniversity]);
    });

    it('returns empty array when no results match', async () => {
      mockRepository.searchUniversities.mockResolvedValue([]);

      const results = await service.searchUniversities('NonExistent');

      expect(results).toEqual([]);
    });

    it('respects custom limit', async () => {
      await service.searchUniversities('UFC', 5);

      expect(mockRepository.searchUniversities).toHaveBeenCalledWith('UFC', 5);
    });
  });

  describe('findUniversityById', () => {
    it('returns university when found', async () => {
      const result = await service.findUniversityById('uni-uuid');

      expect(mockRepository.findUniversityById).toHaveBeenCalledWith('uni-uuid');
      expect(result).toEqual(mockUniversity);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepository.findUniversityById.mockResolvedValue(null);

      await expect(service.findUniversityById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUniversity', () => {
    it('delegates to repository', async () => {
      const dto = {
        name: 'Nova Universidade',
        abbreviation: 'NU',
        state: 'SP',
        city: 'São Paulo',
      };

      const result = await service.createUniversity(dto);

      expect(mockRepository.createUniversity).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUniversity);
    });
  });

  describe('searchCourses', () => {
    it('returns matching results', async () => {
      const results = await service.searchCourses('Ciência');

      expect(mockRepository.searchCourses).toHaveBeenCalledWith('Ciência', undefined, 20);
      expect(results).toEqual([mockCourse]);
    });

    it('returns empty array when no results match', async () => {
      mockRepository.searchCourses.mockResolvedValue([]);

      const results = await service.searchCourses('NonExistent');

      expect(results).toEqual([]);
    });
  });

  describe('findCourseById', () => {
    it('returns course when found', async () => {
      const result = await service.findCourseById('course-uuid');

      expect(mockRepository.findCourseById).toHaveBeenCalledWith('course-uuid');
      expect(result).toEqual(mockCourse);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepository.findCourseById.mockResolvedValue(null);

      await expect(service.findCourseById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCourse', () => {
    it('delegates to repository', async () => {
      const dto = {
        name: 'Engenharia de Software',
        universityId: 'uni-uuid',
      };

      const result = await service.createCourse(dto);

      expect(mockRepository.createCourse).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockCourse);
    });
  });
});
