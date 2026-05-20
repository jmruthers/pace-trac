/**
 * TR05 test #2 — validation failure surfaces skip Alert without unstable ordering.
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ItineraryContent } from '@/features/itinerary/ItineraryContent';
import { INVALID_TRANSPORT_RESOURCE } from '@/features/itinerary/itinerary-fixtures';
import type { TransportRow } from '@/features/planning/types';

const mockUseSecureSupabase = vi.fn();
const mockUsePageCan = vi.fn();

vi.mock('@solvera/pace-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core')>();
  return {
    ...actual,
    useUnifiedAuthContext: () => ({
      user: { id: 'user-1', email: 'planner@test.com' },
      signOut: vi.fn(),
      updatePassword: vi.fn(),
    }),
  };
});

vi.mock('@solvera/pace-core/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/hooks')>();
  return {
    ...actual,
    usePaceMain: vi.fn(),
    useOptionalEvents: () => ({
      selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
      isLoading: false,
    }),
    useEvents: () => ({
      selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
      isLoading: false,
    }),
  };
});

vi.mock('@/features/planning/context/GoogleMapsPlanningContext', () => ({
  GoogleMapsPlanningProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useGoogleMapsPlanning: () => ({
    apiKey: null,
    isLoaded: false,
    isError: true,
    getTimezone: vi.fn(),
  }),
}));

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    useSecureSupabase: () => mockUseSecureSupabase(),
    useResolvedScope: () => ({
      eventId: 'event-1',
      organisationId: 'org-1',
      appId: 'app-1',
      isLoading: false,
    }),
    usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
  };
});

const validTransport: TransportRow = {
  id: 'transport-valid',
  event_id: 'event-1',
  organisation_id: 'org-1',
  status: null,
  notes: null,
  booking_reference: null,
  currency: null,
  individual_cost: null,
  group_cost: null,
  capacity: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
  updated_by: null,
  mode: 'Flight',
  transport_number: null,
  departure_time: '2026-06-01T08:00:00.000Z',
  arrival_time: '2026-06-02T14:00:00.000Z',
  departure_place_id: null,
  departure_display_name: 'Sydney',
  departure_short_address: null,
  departure_coords: null,
  departure_timezone: 'Australia/Sydney',
  arrival_place_id: null,
  arrival_display_name: 'London',
  arrival_short_address: null,
  arrival_coords: null,
  arrival_timezone: 'Europe/London',
};

function buildValidationMockSupabase() {
  const list = (rows: unknown[]) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(async () => ({ data: rows, error: null })),
      })),
    })),
  });

  return {
    rpc: vi.fn(async () => ({ data: false, error: null })),
    from: vi.fn((table: string) => {
      if (table === 'trac_transport') {
        return list([
          validTransport,
          {
            ...validTransport,
            id:
              INVALID_TRANSPORT_RESOURCE.resourceType === 'transport'
                ? INVALID_TRANSPORT_RESOURCE.resourceId
                : 'transport-bad',
            departure_time:
              INVALID_TRANSPORT_RESOURCE.resourceType === 'transport'
                ? INVALID_TRANSPORT_RESOURCE.departureTime
                : 'not-a-date',
            arrival_time:
              INVALID_TRANSPORT_RESOURCE.resourceType === 'transport'
                ? INVALID_TRANSPORT_RESOURCE.arrivalTime
                : '2026-06-03T10:00:00.000Z',
          },
        ]);
      }
      if (table === 'trac_accommodation') return list([]);
      if (table === 'trac_activity') return list([]);
      if (table === 'trac_itinerary_assignment') return list([]);
      if (table === 'base_application') return list([]);
      return list([]);
    }),
  };
}

describe('ItineraryContent validation (TR05 #2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageCan.mockImplementation((pageName: string) => ({
      can: pageName === 'planning' || pageName === 'itinerary',
      isLoading: false,
    }));
    mockUseSecureSupabase.mockReturnValue(buildValidationMockSupabase());
  });

  afterEach(cleanup);

  it('shows skip Alert for invalid logistics while rendering valid rows', async () => {
    render(
      <MemoryRouter>
        <ItineraryContent />
      </MemoryRouter>,
      {
        wrapper: ({ children }) => (
          <QueryClientProvider
            client={new QueryClient({
              defaultOptions: { queries: { retry: false } },
            })}
          >
            {children}
          </QueryClientProvider>
        ),
      }
    );

    await waitFor(() => {
      expect(screen.getByText(/could not be included in the schedule/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Flight/i).length).toBeGreaterThan(0);
  });
});
