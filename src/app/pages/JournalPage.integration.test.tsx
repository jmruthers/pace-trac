/**
 * TR08 journal: happy path, upload failure surfacing, permission denial (no leakage).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { JournalPage } from '@/app/pages/JournalPage';
import type { JournalPost } from '@/types/journal';

const mockUseUnifiedAuthContext = vi.fn();
const mockUseEvents = vi.fn();
const mockUseSecureSupabase = vi.fn();
const mockUseStorageCapableClient = vi.fn();
const mockUsePageCan = vi.fn();
const mockUseResourcePermissions = vi.fn();
const mockUpload = vi.fn();
const mockRemove = vi.fn();

const samplePost: JournalPost = {
  id: 'post-1',
  event_id: 'ev-1',
  organisation_id: 'org-1',
  title: 'Camp day one',
  content: 'Great weather.',
  status: 'published',
  created_at: '2026-05-01T10:00:00Z',
  updated_at: '2026-05-01T10:00:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  trac_journal_images: [{ id: 'img-1', post_id: 'post-1', organisation_id: 'org-1', created_at: '2026-05-01T10:01:00Z', updated_at: null, created_by: 'user-1', updated_by: null }],
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderJournalPage(initialPath = '/journal') {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/journal" element={<JournalPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function buildSupabaseMock(options?: { uploadFails?: boolean }) {
  const posts = [samplePost];
  return {
    from: (table: string) => {
      if (table === 'trac_journal_posts') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: posts, error: null }),
            }),
          }),
          insert: (row: Record<string, unknown>) => ({
            select: () => ({
              single: async () => ({
                data: { ...samplePost, ...row, id: 'post-new' },
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
      if (table === 'trac_journal_images') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: 'img-new',
                  post_id: 'post-new',
                  organisation_id: 'org-1',
                  created_at: '2026-05-01T11:00:00Z',
                  updated_at: null,
                  created_by: 'user-1',
                  updated_by: null,
                },
                error: null,
              }),
            }),
          }),
          delete: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      return {};
    },
    storage: {
      from: () => ({
        upload: mockUpload.mockResolvedValue(
          options?.uploadFails
            ? { data: null, error: { message: 'upload rejected' } }
            : { data: { path: 'img-new' }, error: null }
        ),
        remove: mockRemove.mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed/img-1' },
          error: null,
        }),
      }),
    },
  };
}

vi.mock('@solvera/pace-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core')>();
  return {
    ...actual,
    useUnifiedAuthContext: () => mockUseUnifiedAuthContext(),
  };
});

vi.mock('@solvera/pace-core/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/hooks')>();
  return {
    ...actual,
    useEvents: () => mockUseEvents(),
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    useSecureSupabase: () => mockUseSecureSupabase(),
    useStorageCapableClient: () => mockUseStorageCapableClient(),
    usePageCan: () => mockUsePageCan(),
    useResourcePermissions: () => mockUseResourcePermissions(),
    PagePermissionGuard: ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => {
      const { can, isLoading } = mockUsePageCan();
      if (isLoading) return null;
      if (!can) return <>{fallback ?? <p>Access denied</p>}</>;
      return <>{children}</>;
    },
  };
});

describe('JournalPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUnifiedAuthContext.mockReturnValue({
      user: { id: 'user-1', email: 'user@example.com' },
    });
    mockUseEvents.mockReturnValue({
      selectedEvent: { id: 'ev-1', organisation_id: 'org-1' },
      eventLoading: false,
    });
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
    mockUseResourcePermissions.mockReturnValue({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      isLoading: false,
    });
    mockUseSecureSupabase.mockReturnValue(buildSupabaseMock());
    mockUseStorageCapableClient.mockReturnValue(buildSupabaseMock());
  });

  afterEach(cleanup);

  it('shows event journal posts with images when read is permitted', async () => {
    renderJournalPage();
    await waitFor(() => {
      expect(screen.getByText('Camp day one')).toBeInTheDocument();
    });
    expect(screen.getByText('Great weather.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Camp day one/i })).toBeInTheDocument();
  });

  it('does not leak post content when journal read is denied', async () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });
    renderJournalPage();
    await waitFor(() => {
      expect(screen.queryByText('Camp day one')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
  });

  it('surfaces upload failure via lifecycle when storage rejects upload', async () => {
    const { uploadJournalImage } = await import('@/hooks/journal/journal-image-lifecycle');
    const upload = vi.fn().mockResolvedValue({ data: null, error: { message: 'upload rejected' } });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });

    const storageClient = { storage: { from: () => ({ upload, remove: vi.fn() }) } };
    const dbClient = {
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
        dbClient,
        storageClient,
        row: { post_id: 'post-1', organisation_id: 'org-1', created_by: 'user-1' },
        file: new File(['x'], 'photo.png', { type: 'image/png' }),
      })
    ).rejects.toThrow(/upload/i);
    expect(deleteEq).toHaveBeenCalled();
  });
});
