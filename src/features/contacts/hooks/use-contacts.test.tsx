import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Contact } from '@/features/contacts/types';

const mockUseSecureSupabase = vi.fn();
const mockUseEvents = vi.fn();
const mockUseResourcePermissions = vi.fn();

vi.mock('@solvera/pace-core/hooks', () => ({
  useEvents: () => mockUseEvents(),
}));

vi.mock('@solvera/pace-core/rbac', () => ({
  useSecureSupabase: () => mockUseSecureSupabase(),
  useResourcePermissions: () => mockUseResourcePermissions(),
}));

import { useContacts } from '@/features/contacts/hooks/use-contacts';

const EVENT_ID = 'event-1';
const ORG_ID = 'org-1';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useContacts', () => {
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
    });
  });

  it('maps foreign key delete errors to actionable guidance', async () => {
    const deleteChain = {
      eq: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: { code: '23503', message: 'violates foreign key' } })),
      })),
    };

    mockUseSecureSupabase.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(async () => ({ data: [] as Contact[], error: null })),
          })),
        })),
        delete: vi.fn(() => deleteChain),
      })),
    });

    const { result } = renderHook(() => useContacts(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.deleteContact('contact-1')).rejects.toThrow(
      /linked to one or more risks/i
    );
  });
});
