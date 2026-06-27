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
  private readonly presignS3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');

    const region = this.configService.getOrThrow<string>('S3_REGION');
    const credentials = {
      accessKeyId: this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
    };
    const forcePathStyle = this.configService.get<boolean>('S3_FORCE_PATH_STYLE', true);

    this.s3 = new S3Client({
      endpoint: this.configService.getOrThrow<string>('S3_ENDPOINT'),
      region,
      credentials,
      forcePathStyle,
    });

    const publicEndpoint = this.configService.get<string>('S3_PUBLIC_ENDPOINT');
    if (typeof publicEndpoint === 'string' && publicEndpoint) {
      const urlObj = new URL(publicEndpoint);
      const presignEndpoint = `${urlObj.protocol}//${urlObj.host}`;
      this.presignS3 = new S3Client({
        endpoint: presignEndpoint,
        region,
        credentials,
        forcePathStyle,
      });
    } else {
      this.presignS3 = this.s3;
    }
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
    let url = await getSignedUrl(this.presignS3, command, { expiresIn: expiresInSeconds });

    const publicEndpoint = this.configService.get<string>('S3_PUBLIC_ENDPOINT');
    if (typeof publicEndpoint === 'string' && publicEndpoint) {
      const urlObj = new URL(publicEndpoint);
      const pathPrefix = urlObj.pathname.replace(/\/$/, '');
      if (pathPrefix) {
        const presignEndpoint = `${urlObj.protocol}//${urlObj.host}`;
        url = url.replace(presignEndpoint, `${presignEndpoint}${pathPrefix}`);
      }
    }
    return url;
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
