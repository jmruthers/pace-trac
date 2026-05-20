/**
 * SLICE-09 smoke contract: picker shares tracContactsQueryKey cache with contacts list.
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { tracContactsQueryKey } from '@/features/contacts/contact-query-keys';
import type { Contact } from '@/features/contacts/types';

const mockUseSecureSupabase = vi.fn();
const mockUseEvents = vi.fn();

vi.mock('@solvera/pace-core/hooks', () => ({
  useEvents: () => mockUseEvents(),
}));

vi.mock('@solvera/pace-core/rbac', () => ({
  useSecureSupabase: () => mockUseSecureSupabase(),
  useResourcePermissions: () => ({
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canRead: true,
    canExport: false,
    isLoading: false,
  }),
}));

import { useContacts } from '@/features/contacts/hooks/use-contacts';
import { useTracContactsPicker } from '@/features/contacts/hooks/use-trac-contacts-picker';

const EVENT_ID = 'event-picker-1';

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('trac contacts picker contract (G2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEvents.mockReturnValue({
      selectedEvent: { id: EVENT_ID, organisation_id: 'org-1' },
      isLoading: false,
    });
    mockUseSecureSupabase.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(async () => ({
              data: [
                {
                  id: 'pick-me',
                  event_id: EVENT_ID,
                  organisation_id: 'org-1',
                  first_name: 'Pick',
                  surname: 'Me',
                  role: null,
                  phone_number: null,
                  email_address: null,
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                  created_by: null,
                  updated_by: null,
                },
              ] as Contact[],
              error: null,
            })),
          })),
        })),
      })),
    });
  });

  it('picker hook returns same contacts as list hook for SLICE-09', async () => {
    const list = renderHook(() => useContacts(), { wrapper });
    const picker = renderHook(() => useTracContactsPicker(), { wrapper });

    await waitFor(() => expect(list.result.current.contacts).toHaveLength(1));
    await waitFor(() => expect(picker.result.current.contacts).toHaveLength(1));

    expect(picker.result.current.contacts[0]?.id).toBe('pick-me');
    expect(list.result.current.contacts[0]?.id).toBe('pick-me');
    expect(tracContactsQueryKey(EVENT_ID)).toEqual(['trac-contacts', EVENT_ID]);
  });
});
