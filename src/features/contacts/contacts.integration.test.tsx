/**
 * SLICE-06 contacts integration tests (TR06 testing requirements).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { parseContactFormData } from '@/features/contacts/contact-schema';
import type { Contact } from '@/features/contacts/types';

const mockUseSecureSupabase = vi.fn();
const mockUseEvents = vi.fn();
const mockUseResourcePermissions = vi.fn();
const mockUsePageCan = vi.fn();

vi.mock('@solvera/pace-core/hooks', () => ({
  useEvents: () => mockUseEvents(),
}));

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    useSecureSupabase: () => mockUseSecureSupabase(),
    useResourcePermissions: () => mockUseResourcePermissions(),
    usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
    PagePermissionGuard: ({
      children,
      fallback,
    }: {
      children: ReactNode;
      fallback?: ReactNode;
    }) => {
      const { can, isLoading } = mockUsePageCan();
      if (isLoading) return null;
      if (!can) return fallback ?? null;
      return children;
    },
  };
});

import { useContacts } from '@/features/contacts/hooks/use-contacts';
import { ContactsPage } from '@/app/pages/ContactsPage';
import { renderHook } from '@testing-library/react';

const EVENT_ID = 'event-1';
const ORG_ID = 'org-1';

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function buildMockSupabase(initial: Contact[] = []) {
  let store = [...initial];

  const listResult = async () => ({ data: store, error: null });

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(listResult),
        })),
      })),
      insert: vi.fn((rows: Record<string, unknown>[]) => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => {
            const row: Contact = {
              id: 'contact-new',
              event_id: EVENT_ID,
              organisation_id: ORG_ID,
              first_name: rows[0].first_name as string,
              surname: rows[0].surname as string,
              role: (rows[0].role as string | undefined) ?? null,
              phone_number: (rows[0].phone_number as string | undefined) ?? null,
              email_address: (rows[0].email_address as string | undefined) ?? null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              created_by: null,
              updated_by: null,
            };
            store = [...store, row];
            return { data: row, error: null };
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({ data: store[0], error: null })),
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      })),
    })),
    getStore: () => store,
  };
}

describe('contacts integration (SLICE-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEvents.mockReturnValue({
      selectedEvent: { id: EVENT_ID, organisation_id: ORG_ID },
      isLoading: false,
    });
    mockUseResourcePermissions.mockReturnValue({
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canRead: true,
      canExport: false,
      isLoading: false,
      resilienceStatus: 'ok',
      resilienceErrors: [],
      sourceOutcomes: {},
    });
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
  });

  afterEach(cleanup);

  it('happy path: planner adds contact; appears in list', async () => {
    const supabase = buildMockSupabase();
    mockUseSecureSupabase.mockReturnValue(supabase);

    const { result } = renderHook(() => useContacts(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.contacts).toHaveLength(0);

    await result.current.addContact({ first_name: 'Alex', surname: 'Planner' });

    await waitFor(() => expect(result.current.contacts).toHaveLength(1));
    expect(result.current.contacts[0]?.first_name).toBe('Alex');
    expect(result.current.contacts[0]?.surname).toBe('Planner');
  });

  it('validation failure: missing required field is blocked with message', () => {
    expect(() => parseContactFormData({ first_name: '', surname: 'Doe' })).toThrow(
      /First name is required/
    );
  });

  it('auth / permission failure: no contacts permission shows AccessDenied', () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/contacts']}>
        <ContactsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/do not have permission to view this page/i)).toBeInTheDocument();
  });
});
