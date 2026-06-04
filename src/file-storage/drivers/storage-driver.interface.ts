export interface UploadOptions {
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StorageDriver {
  upload(options: UploadOptions): Promise<void>;
  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}

export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');
