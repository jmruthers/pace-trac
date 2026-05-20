/**
 * TR08 journal: happy path, upload failure surfacing, permission denial (no leakage).
 */
import { useState, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JournalPostSaveValues } from '@/components/journal/JournalPostEditor';
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
const mockToastFn = vi.fn();
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
  trac_journal_images: [
    {
      id: 'img-1',
      post_id: 'post-1',
      organisation_id: 'org-1',
      created_at: '2026-05-01T10:01:00Z',
      updated_at: null,
      created_by: 'user-1',
      updated_by: null,
    },
  ],
};

let postsStore: JournalPost[] = [samplePost];

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
  return {
    from: (table: string) => {
      if (table === 'trac_journal_posts') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: [...postsStore], error: null }),
            }),
          }),
          insert: (row: Record<string, unknown>) => ({
            select: () => ({
              single: async () => {
                const newPost: JournalPost = {
                  ...samplePost,
                  ...row,
                  id: 'post-new',
                  title: String(row.title ?? 'Untitled'),
                  content: String(row.content ?? ''),
                  status: (row.status as JournalPost['status']) ?? 'published',
                  trac_journal_images: [],
                };
                postsStore = [newPost, ...postsStore];
                return { data: newPost, error: null };
              },
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

/** Test double: native inputs avoid duplicate-React issues with pace-core Form in vitest. */
/* eslint-disable pace-core-compliance/prefer-pace-core-components -- intentional minimal editor stub */
vi.mock('@/components/journal/JournalPostEditor', () => ({
  JournalPostEditor: ({
    open,
    onSave,
    isSubmitting,
  }: {
    open: boolean;
    onSave: (values: JournalPostSaveValues) => Promise<void>;
    isSubmitting?: boolean;
  }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    if (!open) return null;

    const submit = () =>
      onSave({
        title,
        content,
        status: 'published',
        images: pendingFile != null ? [pendingFile] : [],
      }).catch(() => {
        /* JournalPage mutation surfaces errors via toast */
      });

    return (
      <dialog open aria-label="Journal editor">
        <label>
          Title
          <input
            aria-label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Content
          <textarea
            aria-label="Content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </label>
        <label>
          Images
          <input
            type="file"
            aria-label="Images"
            accept="image/png"
            onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button type="button" disabled={isSubmitting} onClick={() => void submit()}>
          Save
        </button>
      </dialog>
    );
  },
}));

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
    useToast: () => ({ toast: mockToastFn }),
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
    postsStore = [samplePost];
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
    const client = buildSupabaseMock();
    mockUseSecureSupabase.mockReturnValue(client);
    mockUseStorageCapableClient.mockReturnValue(client);
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

  it('creates a post with an image through the editor and shows it in the feed', async () => {
    const user = userEvent.setup();
    renderJournalPage();

    await waitFor(() => {
      expect(screen.getByText('Camp day one')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /new entry/i }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^title$/i), 'River crossing');
    await user.type(within(dialog).getByLabelText(/^content$/i), 'Everyone made it across.');

    const fileInput = within(dialog).getByLabelText(/^images$/i);
    const file = new File(['bytes'], 'crossing.png', { type: 'image/png' });
    await user.upload(fileInput, file);
    await user.click(within(dialog).getByRole('button', { name: /^save$/i }));

    const main = screen.getByRole('main');
    await waitFor(() => {
      const created = within(main)
        .getAllByRole('article')
        .find((article) => within(article).queryByText('River crossing') != null);
      expect(created).toBeDefined();
      expect(within(created!).getByText('Everyone made it across.')).toBeInTheDocument();
    });
    expect(mockUpload).toHaveBeenCalled();
  });

  it('shows a destructive toast when image upload fails during create', async () => {
    const user = userEvent.setup();
    const client = buildSupabaseMock({ uploadFails: true });
    mockUseSecureSupabase.mockReturnValue(client);
    mockUseStorageCapableClient.mockReturnValue(client);

    renderJournalPage();
    await waitFor(() => expect(screen.getByText('Camp day one')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /new entry/i }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/^title$/i), 'Failed upload');
    await user.upload(
      within(dialog).getByLabelText(/^images$/i),
      new File(['x'], 'bad.png', { type: 'image/png' })
    );
    await user.click(within(dialog).getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mockToastFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Could not save journal entry',
        })
      );
    });
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
