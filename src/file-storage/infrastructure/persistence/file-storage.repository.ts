import type { FileSelect } from '../../../database/schema/files';

export interface CreateFileData {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  key: string;
  uploadedBy: string;
  purpose: string;
}

export abstract class FileStorageRepository {
  abstract create(data: CreateFileData): Promise<FileSelect>;

  abstract findById(id: string): Promise<FileSelect | null>;

  abstract delete(id: string): Promise<void>;
}
