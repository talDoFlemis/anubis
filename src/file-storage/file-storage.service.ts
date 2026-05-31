import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { FileSelect } from '../database/schema/files';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, S3_CLIENT } from './file-storage.constants';
import { FileStorageRepository } from './infrastructure/persistence/file-storage.repository';

@Injectable()
export class FileStorageService {
  private readonly bucket: string;

  constructor(
    private readonly fileStorageRepository: FileStorageRepository,
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');
  }

  async upload(
    file: Express.Multer.File,
    uploadedBy: string,
    purpose: string,
  ): Promise<FileSelect> {
    this.validateFile(file);

    const fileId = randomUUID();
    const key = `${purpose}/${fileId}-${file.originalname}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return this.fileStorageRepository.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      bucket: this.bucket,
      key,
      uploadedBy,
      purpose,
    });
  }

  async getSignedDownloadUrl(fileId: string, expiresInSeconds: number = 3600): Promise<string> {
    const record = await this.findById(fileId);

    const command = new GetObjectCommand({
      Bucket: record.bucket,
      Key: record.key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async delete(fileId: string): Promise<void> {
    const record = await this.findById(fileId);

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: record.bucket,
        Key: record.key,
      }),
    );

    await this.fileStorageRepository.delete(fileId);
  }

  async findById(fileId: string): Promise<FileSelect> {
    const record = await this.fileStorageRepository.findById(fileId);

    if (!record) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return record;
  }

  private validateFile(file: Express.Multer.File): void {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Tipos aceitos: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
  }
}
