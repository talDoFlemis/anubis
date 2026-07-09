import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { ScoreAdjustmentRepository } from './infrastructure/persistence/score-adjustment.repository';
import { ScoreAdjustmentService } from './score-adjustment.service';

describe('ScoreAdjustmentService', () => {
  let service: ScoreAdjustmentService;
  let mockRepository: Record<string, jest.Mock>;
  let mockEnrollmentService: Record<string, jest.Mock>;

  const mockEnrollment = {
    id: 'enrollment-id',
    candidateId: 'candidate-id',
    ira: '8.50',
    scoreValidated: '7.20',
  };

  beforeEach(async () => {
    mockRepository = {
      findByEnrollment: jest.fn(),
      findByType: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      lockAll: jest.fn(),
    };

    mockEnrollmentService = {
      findById: jest.fn().mockResolvedValue(mockEnrollment),
    };

    const module = await Test.createTestingModule({
      providers: [
        ScoreAdjustmentService,
        { provide: ScoreAdjustmentRepository, useValue: mockRepository },
        { provide: EnrollmentService, useValue: mockEnrollmentService },
      ],
    }).compile();

    service = module.get<ScoreAdjustmentService>(ScoreAdjustmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEnrollment', () => {
    it('should call repository findByEnrollment', async () => {
      mockRepository.findByEnrollment.mockResolvedValue([]);
      const result = await service.findByEnrollment('enrollment-id');
      expect(mockRepository.findByEnrollment).toHaveBeenCalledWith('enrollment-id');
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create an adjustment successfully when not locked', async () => {
      mockRepository.findByType.mockResolvedValue(null);
      mockRepository.upsert.mockResolvedValue({ id: 'adj-id' });

      const result = await service.create('user-id', 'enrollment-id', {
        scoreType: 'ira',
        adjustedValue: 9.0,
        justification: 'Nota corrigida',
      });

      expect(mockEnrollmentService.findById).toHaveBeenCalledWith('enrollment-id');
      expect(mockRepository.upsert).toHaveBeenCalledWith({
        enrollmentId: 'enrollment-id',
        adjustedBy: 'user-id',
        scoreType: 'ira',
        originalValue: '8.50',
        adjustedValue: '9.00',
        justification: 'Nota corrigida',
        isLocked: false,
      });
      expect(result).toEqual({ id: 'adj-id' });
    });

    it('should throw BadRequestException if existing adjustment is locked', async () => {
      mockRepository.findByType.mockResolvedValue({ isLocked: true });

      await expect(
        service.create('user-id', 'enrollment-id', {
          scoreType: 'ira',
          adjustedValue: 9.0,
          justification: 'Nota corrigida',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete adjustment if not locked', async () => {
      mockRepository.findByType.mockResolvedValue({ isLocked: false });

      await service.delete('enrollment-id', 'ira');

      expect(mockRepository.delete).toHaveBeenCalledWith('enrollment-id', 'ira');
    });

    it('should throw BadRequestException if adjustment is locked', async () => {
      mockRepository.findByType.mockResolvedValue({ isLocked: true });

      await expect(service.delete('enrollment-id', 'ira')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if adjustment does not exist', async () => {
      mockRepository.findByType.mockResolvedValue(null);

      await expect(service.delete('enrollment-id', 'ira')).rejects.toThrow(NotFoundException);
    });
  });

  describe('lockAll', () => {
    it('should call repository lockAll', async () => {
      await service.lockAll('enrollment-id');
      expect(mockRepository.lockAll).toHaveBeenCalledWith('enrollment-id');
    });
  });
});
