import { Module } from '@nestjs/common';
import { FileStorageRepository } from '../file-storage.repository';
import { FileStorageDrizzleRepository } from './file-storage.drizzle-repository';

@Module({
  providers: [
    {
      provide: FileStorageRepository,
      useClass: FileStorageDrizzleRepository,
    },
  ],
  exports: [FileStorageRepository],
})
export class FileStorageDrizzlePersistenceModule {}
