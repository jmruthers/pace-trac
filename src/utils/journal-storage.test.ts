import { describe, it, expect } from 'vitest';
import {
  JOURNAL_FILES_BUCKET,
  journalStorageObjectPath,
  validateJournalImageFile,
} from '@/utils/journal-storage';

describe('journal-storage', () => {
  it('uses the shared files bucket', () => {
    expect(JOURNAL_FILES_BUCKET).toBe('files');
  });

  it('maps image id to storage object path', () => {
    expect(journalStorageObjectPath('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    );
  });

  it('rejects unsupported image types', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateJournalImageFile(file)).toMatch(/JPEG/i);
  });

  it('rejects oversized images', () => {
    const file = new File([new Uint8Array(11 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    expect(validateJournalImageFile(file)).toMatch(/10 MB/i);
  });

  it('accepts valid png images', () => {
    const file = new File(['x'], 'photo.png', { type: 'image/png' });
    expect(validateJournalImageFile(file)).toBeNull();
  });
});
