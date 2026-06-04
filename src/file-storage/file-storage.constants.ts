export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
