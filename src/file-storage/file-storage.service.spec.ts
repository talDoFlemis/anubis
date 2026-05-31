import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DRIZZLE_TX } from '../database/drizzle.constants';
import { S3_CLIENT } from './file-storage.constants';
import { FileStorageService } from './file-storage.service';

describe('FileStorageService', () => {
  let service: FileStorageService;
  let mockDb: any;
  let mockS3: any;

  const mockFile = {
    originalname: 'test.pdf',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  const mockFileRecord = {
    id: 'file-uuid',
    originalName: 'test.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    bucket: 'anubis',
    key: 'cv-items/file-uuid-test.pdf',
    uploadedBy: 'user-uuid',
    purpose: 'cv-items',
    uploadedAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockFileRecord]),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockFileRecord]),
      delete: jest.fn().mockReturnThis(),
    };

    mockS3 = {
      send: jest.fn().mockResolvedValue({}),
    };

    const module = await Test.createTestingModule({
      providers: [
        FileStorageService,
        { provide: DRIZZLE_TX, useValue: mockDb },
        { provide: S3_CLIENT, useValue: mockS3 },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('anubis'),
            get: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<FileStorageService>(FileStorageService);
  });

  describe('upload', () => {
    it('uploads a file to S3 and saves metadata', async () => {
      const result = await service.upload(mockFile, 'user-uuid', 'cv-items');

      expect(mockS3.send).toHaveBeenCalledTimes(1);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(mockFileRecord);
    });

    it('rejects files exceeding max size', async () => {
      const largeFile = {
        ...mockFile,
        size: 11 * 1024 * 1024,
      } as Express.Multer.File;

      await expect(service.upload(largeFile, 'user-uuid', 'cv-items')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects files with invalid mime type', async () => {
      const invalidFile = {
        ...mockFile,
        mimetype: 'text/plain',
      } as Express.Multer.File;

      await expect(service.upload(invalidFile, 'user-uuid', 'cv-items')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('accepts PDF files', async () => {
      const pdfFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      await expect(service.upload(pdfFile, 'user-uuid', 'cv-items')).resolves.toBeDefined();
    });

    it('accepts PNG files', async () => {
      const pngFile = {
        ...mockFile,
        mimetype: 'image/png',
      } as Express.Multer.File;

      await expect(service.upload(pngFile, 'user-uuid', 'cv-items')).resolves.toBeDefined();
    });

    it('accepts JPEG files', async () => {
      const jpegFile = {
        ...mockFile,
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      await expect(service.upload(jpegFile, 'user-uuid', 'cv-items')).resolves.toBeDefined();
    });
  });

  describe('findById', () => {
    it('returns file record when found', async () => {
      const result = await service.findById('file-uuid');
      expect(result).toEqual(mockFileRecord);
    });

    it('throws NotFoundException when file not found', async () => {
      mockDb.limit = jest.fn().mockResolvedValue([]);

      await expect(service.findById('missing-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes file from S3 and database', async () => {
      await service.delete('file-uuid');

      expect(mockS3.send).toHaveBeenCalledTimes(1);
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
