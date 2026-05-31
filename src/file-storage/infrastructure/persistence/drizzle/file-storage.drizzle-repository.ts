import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_TX } from '../../../../database/drizzle.constants';
import type { DrizzleDB } from '../../../../database/drizzle.provider';
import type { FileSelect } from '../../../../database/schema/files';
import { files } from '../../../../database/schema/files';
import type { CreateFileData } from '../file-storage.repository';
import { FileStorageRepository } from '../file-storage.repository';

@Injectable()
export class FileStorageDrizzleRepository extends FileStorageRepository {
  constructor(@Inject(DRIZZLE_TX) private readonly db: DrizzleDB) {
    super();
  }

  async create(data: CreateFileData): Promise<FileSelect> {
    const [record] = await this.db
      .insert(files)
      .values({
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        bucket: data.bucket,
        key: data.key,
        uploadedBy: data.uploadedBy,
        purpose: data.purpose,
      })
      .returning();

    return record;
  }

  async findById(id: string): Promise<FileSelect | null> {
    const [record] = await this.db.select().from(files).where(eq(files.id, id)).limit(1);

    return record ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(files).where(eq(files.id, id));
  }
}
