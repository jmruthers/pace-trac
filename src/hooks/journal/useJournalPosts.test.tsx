import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useJournalPosts } from '@/hooks/journal/useJournalPosts';

const mockUseUnifiedAuthContext = vi.fn();
const mockUseEvents = vi.fn();
const mockUseSecureSupabase = vi.fn();
const mockUseStorageCapableClient = vi.fn();
const mockToast = vi.fn();

vi.mock('@solvera/pace-core', () => ({
  useUnifiedAuthContext: () => mockUseUnifiedAuthContext(),
}));

vi.mock('@solvera/pace-core/hooks', () => ({
  useEvents: () => mockUseEvents(),
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@solvera/pace-core/rbac', () => ({
  useSecureSupabase: () => mockUseSecureSupabase(),
  useStorageCapableClient: () => mockUseStorageCapableClient(),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useJournalPosts', () => {
  beforeEach(() => {
    mockUseUnifiedAuthContext.mockReturnValue({ user: { id: 'user-1' } });
    mockUseEvents.mockReturnValue({
      selectedEvent: { id: 'ev-1', organisation_id: 'org-1' },
      isLoading: false,
    });
    mockUseSecureSupabase.mockReturnValue({
      from: (table: string) => {
        if (table === 'trac_journal_posts') {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({
                  data: [
                    {
                      id: 'post-1',
                      event_id: 'ev-1',
                      organisation_id: 'org-1',
                      title: 'Hello',
                      content: 'Body',
                      status: 'published',
                      created_at: '2026-01-01',
                      updated_at: '2026-01-01',
                      created_by: 'user-1',
                      updated_by: 'user-1',
                      trac_journal_images: [],
                    },
                  ],
                  error: null,
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: { id: 'post-new', title: 'New', content: 'C' },
                  error: null,
                }),
              }),
            }),
            update: () => ({
              eq: async () => ({ error: null }),
            }),
            delete: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        }
        return {};
      },
    });
    mockUseStorageCapableClient.mockReturnValue({
      storage: {
        from: () => ({
          upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
          remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      },
    });
  });

  afterEach(cleanup);

  it('loads posts for the selected event', async () => {
    const { result } = renderHook(() => useJournalPosts(), { wrapper });
    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1);
    });
    expect(result.current.posts[0]?.title).toBe('Hello');
  });

  it('creates a post without images', async () => {
    const { result } = renderHook(() => useJournalPosts(), { wrapper });
    await waitFor(() => expect(result.current.posts).toHaveLength(1));
    await result.current.createPost({ title: 'New entry', content: 'Notes', images: [] });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Journal entry saved' }));
  });

  it('updates and deletes posts', async () => {
    const { result } = renderHook(() => useJournalPosts(), { wrapper });
    await waitFor(() => expect(result.current.posts).toHaveLength(1));
    const post = result.current.posts[0]!;
    await result.current.updatePost({
      postId: post.id,
      title: 'Updated',
      content: 'Revised',
      images: [],
    });
    await result.current.deletePost(post);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Journal entry deleted' }));
  });

  it('uploads images when creating a post with attachments', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'img-new' }, error: null });
    mockUseStorageCapableClient.mockReturnValue({
      storage: { from: () => ({ upload, remove: vi.fn().mockResolvedValue({ data: null, error: null }) }) },
    });
    mockUseSecureSupabase.mockReturnValue({
      from: (table: string) => {
        if (table === 'trac_journal_posts') {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({ data: [], error: null }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: 'post-new',
                    event_id: 'ev-1',
                    organisation_id: 'org-1',
                    title: 'With photo',
                    content: 'Pic',
                    status: 'published',
                    created_at: '2026-01-01',
                    updated_at: '2026-01-01',
                    created_by: 'user-1',
                    updated_by: 'user-1',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'trac_journal_images') {
          return {
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: 'img-new',
                    post_id: 'post-new',
                    organisation_id: 'org-1',
                    created_at: '2026-01-01',
                    updated_at: null,
                    created_by: 'user-1',
                    updated_by: null,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      },
    });

    const { result } = renderHook(() => useJournalPosts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    await result.current.createPost({ title: 'With photo', content: 'Pic', images: [file] });
    expect(upload).toHaveBeenCalled();
  });

  it('deletes an image by id', async () => {
    const remove = vi.fn().mockResolvedValue({ data: null, error: null });
    mockUseStorageCapableClient.mockReturnValue({
      storage: { from: () => ({ upload: vi.fn(), remove }) },
    });
    mockUseSecureSupabase.mockReturnValue({
      from: (table: string) => {
        if (table === 'trac_journal_posts') {
          return {
            select: () => ({
              eq: () => ({
                order: async () => ({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === 'trac_journal_images') {
          return {
            delete: () => ({
              eq: async () => ({ error: null }),
            }),
          };
        }
        return {};
      },
    });

    const { result } = renderHook(() => useJournalPosts(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await result.current.deleteImage('img-1');
    expect(remove).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Image removed' }));
  });
});
