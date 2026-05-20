import { describe, it, expect, vi } from 'vitest';
import {
  uploadJournalImage,
  deleteJournalImage,
  removeStorageObjectsForPost,
  JournalImageLifecycleError,
  type JournalDbClient,
  type JournalStorageClient,
} from '@/hooks/journal/journal-image-lifecycle';

function createMocks() {
  const upload = vi.fn();
  const remove = vi.fn();
  const insert = vi.fn();
  const deleteEq = vi.fn();

  const storageClient: JournalStorageClient = {
    storage: {
      from: () => ({ upload, remove }),
    },
  };

  const dbClient: JournalDbClient = {
    from: () => ({
      insert: (row: unknown) => {
        insert(row);
        return {
          select: () => ({
            single: async () => ({
              data: {
                id: 'img-1',
                post_id: 'post-1',
                organisation_id: 'org-1',
                created_at: '2026-01-01T00:00:00Z',
                updated_at: null,
                created_by: 'user-1',
                updated_by: null,
              },
              error: null,
            }),
          }),
        };
      },
      delete: () => ({
        eq: () => {
          deleteEq();
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };

  return { storageClient, dbClient, upload, remove, insert, deleteEq };
}

describe('journal-image-lifecycle', () => {
  it('uploads after inserting image row', async () => {
    const { storageClient, dbClient, upload, insert } = createMocks();
    upload.mockResolvedValue({ data: { path: 'img-1' }, error: null });
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    const image = await uploadJournalImage({
      dbClient,
      storageClient,
      row: { post_id: 'post-1', organisation_id: 'org-1', created_by: 'user-1' },
      file,
    });

    expect(image.id).toBe('img-1');
    expect(insert).toHaveBeenCalled();
    expect(upload).toHaveBeenCalledWith('img-1', file);
  });

  it('rolls back image row when upload fails', async () => {
    const { storageClient, dbClient, upload, deleteEq } = createMocks();
    upload.mockResolvedValue({ data: null, error: { message: 'upload denied' } });
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    await expect(
      uploadJournalImage({
        dbClient,
        storageClient,
        row: { post_id: 'post-1', organisation_id: 'org-1', created_by: 'user-1' },
        file,
      })
    ).rejects.toThrow(JournalImageLifecycleError);

    expect(deleteEq).toHaveBeenCalled();
  });

  it('deleteJournalImage removes storage before database row', async () => {
    const order: string[] = [];
    const remove = vi.fn(async () => {
      order.push('storage');
      return { data: null, error: null };
    });
    const deleteEq = vi.fn(async () => {
      order.push('db');
      return { error: null };
    });

    const storageClient: JournalStorageClient = {
      storage: { from: () => ({ upload: vi.fn(), remove }) },
    };
    const dbClient: JournalDbClient = {
      from: () => ({
        insert: () => ({
          select: () => ({ single: async () => ({ data: null, error: null }) }),
        }),
        delete: () => ({ eq: () => deleteEq() }),
      }),
    };

    await deleteJournalImage({ dbClient, storageClient, imageId: 'img-1' });
    expect(order).toEqual(['storage', 'db']);
  });

  it('deleteJournalImage surfaces storage failure without deleting row', async () => {
    const remove = vi.fn(async () => ({ data: null, error: { message: 'storage fail' } }));
    const deleteEq = vi.fn();

    const storageClient: JournalStorageClient = {
      storage: { from: () => ({ upload: vi.fn(), remove }) },
    };
    const dbClient: JournalDbClient = {
      from: () => ({
        insert: () => ({
          select: () => ({ single: async () => ({ data: null, error: null }) }),
        }),
        delete: () => ({ eq: () => deleteEq() }),
      }),
    };

    await expect(
      deleteJournalImage({ dbClient, storageClient, imageId: 'img-1' })
    ).rejects.toThrow(/storage/i);
    expect(deleteEq).not.toHaveBeenCalled();
  });

  it('removeStorageObjectsForPost returns empty result for no images', async () => {
    const storageClient: JournalStorageClient = {
      storage: { from: () => ({ upload: vi.fn(), remove: vi.fn() }) },
    };
    const result = await removeStorageObjectsForPost(storageClient, []);
    expect(result).toEqual({ removed: [], failures: [] });
  });

  it('removeStorageObjectsForPost removes all ids on success', async () => {
    const remove = vi.fn(async () => ({ data: null, error: null }));
    const storageClient: JournalStorageClient = {
      storage: { from: () => ({ upload: vi.fn(), remove }) },
    };
    const result = await removeStorageObjectsForPost(storageClient, ['a', 'b']);
    expect(result.removed).toEqual(['a', 'b']);
    expect(remove).toHaveBeenCalledWith(['a', 'b']);
  });

  it('reports rollback failure when row delete fails after upload error', async () => {
    const { storageClient, dbClient, upload } = createMocks();
    upload.mockResolvedValue({ data: null, error: { message: 'upload denied' } });
    const deleteEq = vi.fn(async () => ({ error: { message: 'db fail' } }));
    const failingDb: JournalDbClient = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: {
                id: 'img-1',
                post_id: 'post-1',
                organisation_id: 'org-1',
                created_at: '2026-01-01T00:00:00Z',
                updated_at: null,
                created_by: 'user-1',
                updated_by: null,
              },
              error: null,
            }),
          }),
        }),
        delete: () => ({ eq: () => deleteEq() }),
      }),
    };

    await expect(
      uploadJournalImage({
        dbClient: failingDb,
        storageClient,
        row: { post_id: 'post-1', organisation_id: 'org-1', created_by: 'user-1' },
        file: new File(['x'], 'a.png', { type: 'image/png' }),
      })
    ).rejects.toThrow(/could not be rolled back/i);
    void dbClient;
  });

  it('removeStorageObjectsForPost reports failures', async () => {
    const remove = vi.fn(async () => ({ data: null, error: { message: 'bulk fail' } }));
    const storageClient: JournalStorageClient = {
      storage: { from: () => ({ upload: vi.fn(), remove }) },
    };

    const result = await removeStorageObjectsForPost(storageClient, ['a', 'b']);
    expect(result.failures).toEqual(['a', 'b']);
    expect(result.removed).toEqual([]);
  });
});
