export const JOURNAL_FILES_BUCKET = 'files' as const;

/** Storage object key is the image row id (TRAC domain contract). */
export function journalStorageObjectPath(imageId: string): string {
  return imageId;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function validateJournalImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Image must be JPEG, PNG, GIF, WebP, or HEIC.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }
  return null;
}
