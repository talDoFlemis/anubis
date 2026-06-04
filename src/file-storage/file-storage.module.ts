import { Module } from '@nestjs/common';
import { S3StorageDriver } from './drivers/s3-storage.driver';
import { STORAGE_DRIVER } from './drivers/storage-driver.interface';
import { FileStorageService } from './file-storage.service';
import { FileStorageDrizzlePersistenceModule } from './infrastructure/persistence/drizzle/drizzle-persistence.module';

@Module({
  imports: [FileStorageDrizzlePersistenceModule],
  providers: [
    S3StorageDriver,
    {
      provide: STORAGE_DRIVER,
      useExisting: S3StorageDriver,
    },
    FileStorageService,
  ],
  exports: [FileStorageService],
})
export class FileStorageModule {}
