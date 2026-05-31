import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3_CLIENT } from './file-storage.constants';
import { FileStorageService } from './file-storage.service';

@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): S3Client => {
        return new S3Client({
          endpoint: configService.getOrThrow<string>('S3_ENDPOINT'),
          region: configService.getOrThrow<string>('S3_REGION'),
          credentials: {
            accessKeyId: configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
          },
          forcePathStyle: configService.get<boolean>('S3_FORCE_PATH_STYLE', true),
        });
      },
    },
    FileStorageService,
  ],
  exports: [FileStorageService],
})
export class FileStorageModule {}
