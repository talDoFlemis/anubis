import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageDriver, UploadOptions } from './storage-driver.interface';

@Injectable()
export class S3StorageDriver implements StorageDriver {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');
    this.s3 = new S3Client({
      endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
      region: this.configService.getOrThrow<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
      forcePathStyle: this.configService.get<boolean>('S3_FORCE_PATH_STYLE', true),
    });
  }

  async upload(options: UploadOptions): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: options.key,
        Body: options.buffer,
        ContentType: options.mimeType,
      }),
    );
  }

  async getSignedDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
