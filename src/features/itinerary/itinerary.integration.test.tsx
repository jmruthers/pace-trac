/**
 * SLICE-05 itinerary integration tests (TR05 testing requirements).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { AssignmentRow } from '@/features/assignments/types';
import type {
  AccommodationRow,
  ActivityRow,
  TransportRow,
} from '@/features/planning/types';
import { ItineraryPage } from '@/app/pages/ItineraryPage';
import { ItineraryContent } from '@/features/itinerary/ItineraryContent';

const mockUseSecureSupabase = vi.fn();
const mockUsePageCan = vi.fn();

const EVENT_ID = 'event-1';
const ORG_ID = 'org-1';
const APP_PARTICIPANT_1 = 'app-participant-1';
const TRANSPORT_ID = 'transport-1';
const ACTIVITY_ID = 'activity-1';

vi.mock('@solvera/pace-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core')>();
  return {
    ...actual,
    useUnifiedAuthContext: () => ({
      user: { id: 'user-participant-1', email: 'participant@test.com' },
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
      selectedEvent: { id: EVENT_ID, organisation_id: ORG_ID },
      isLoading: false,
    }),
    useEvents: () => ({
      selectedEvent: { id: EVENT_ID, organisation_id: ORG_ID },
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
      eventId: EVENT_ID,
      organisationId: ORG_ID,
      appId: 'app-1',
      isLoading: false,
    }),
    usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
    PagePermissionGuard: ({
      children,
      fallback,
    }: {
      children: ReactNode;
      fallback?: ReactNode;
    }) => {
      const itineraryRead = mockUsePageCan('itinerary', 'read');
      if (itineraryRead.isLoading) return null;
      if (!itineraryRead.can) return fallback ?? null;
      return children;
    },
  };
});

const transportRow: TransportRow = {
  id: TRANSPORT_ID,
  event_id: EVENT_ID,
  organisation_id: ORG_ID,
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
  transport_number: 'TR100',
  departure_time: '2026-06-01T08:00:00.000Z',
  arrival_time: '2026-06-02T14:00:00.000Z',
  departure_place_id: null,
  departure_display_name: 'Sydney',
  departure_short_address: null,
  departure_coords: { lat: -33.9, lng: 151.2 },
  departure_timezone: 'Australia/Sydney',
  arrival_place_id: null,
  arrival_display_name: 'London',
  arrival_short_address: null,
  arrival_coords: { lat: 51.5, lng: -0.1 },
  arrival_timezone: 'Europe/London',
};

const activityRow: ActivityRow = {
  id: ACTIVITY_ID,
  event_id: EVENT_ID,
  organisation_id: ORG_ID,
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
  name: 'Opening session',
  start_time: '2026-06-02T10:00:00.000Z',
  finish_time: '2026-06-02T18:00:00.000Z',
  start_location_place_id: null,
  start_location_display_name: 'Venue',
  start_location_short_address: null,
  start_location_coords: { lat: 51.5, lng: -0.12 },
  start_location_timezone: 'Europe/London',
  finish_location_place_id: null,
  finish_location_display_name: 'Venue',
  finish_location_short_address: null,
  finish_location_coords: { lat: 51.5, lng: -0.12 },
  finish_location_timezone: 'Europe/London',
};

const accommodationRows: AccommodationRow[] = [];

function buildItineraryMockSupabase(options: {
  viewerApplicationId: string | null;
  assignments: AssignmentRow[];
  participantALogisticsOnly?: boolean;
}) {
  const assignmentStore = [...options.assignments];

  return {
    rpc: vi.fn((fn: string, args: Record<string, unknown>) => {
      if (fn === 'base_application_is_applicant') {
        const appId = args.p_application_id as string;
        const isApplicant =
          options.viewerApplicationId != null && appId === options.viewerApplicationId;
        return Promise.resolve({ data: isApplicant, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
    from: vi.fn((table: string) => {
      if (table === 'trac_itinerary_assignment') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(async () => ({ data: assignmentStore, error: null })),
            })),
          })),
        };
      }

      if (table === 'base_application') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(async () => ({
                data:
                  options.viewerApplicationId != null
                    ? [
                        {
                          id: options.viewerApplicationId,
                          event_id: EVENT_ID,
                          status: 'approved',
                        },
                      ]
                    : [],
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'trac_transport') {
        const rows =
          options.participantALogisticsOnly === true
            ? assignmentStore.some(
                (a) =>
                  a.application_id === APP_PARTICIPANT_1 &&
                  a.resource_type === 'transport' &&
                  a.resource_id === TRANSPORT_ID
              )
              ? [transportRow]
              : []
            : [transportRow];
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(async () => ({ data: rows, error: null })),
            })),
          })),
        };
      }

      if (table === 'trac_activity') {
        const rows =
          options.participantALogisticsOnly === true
            ? assignmentStore.some(
                (a) =>
                  a.application_id === APP_PARTICIPANT_1 &&
                  a.resource_type === 'activity' &&
                  a.resource_id === ACTIVITY_ID
              )
              ? [activityRow]
              : []
            : [activityRow];
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(async () => ({ data: rows, error: null })),
            })),
          })),
        };
      }

      if (table === 'trac_accommodation') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(async () => ({ data: accommodationRows, error: null })),
            })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(async () => ({ data: [], error: null })),
          })),
        })),
      };
    }),
  };
}

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function mockPageCan(planningRead: boolean, itineraryRead = true) {
  mockUsePageCan.mockImplementation((pageName: string, operation: string) => {
    if (pageName === 'itinerary' && operation === 'read') {
      return { can: itineraryRead, isLoading: false };
    }
    if (pageName === 'planning' && operation === 'read') {
      return { can: planningRead, isLoading: false };
    }
    return { can: false, isLoading: false };
  });
}

describe('itinerary integration (SLICE-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPageCan(false, true);
  });

  afterEach(cleanup);

  it('happy path (participant role): assigned logistics appear after load via CR25 derivation', async () => {
    const assignments: AssignmentRow[] = [
      {
        id: 'assign-1',
        application_id: APP_PARTICIPANT_1,
        resource_type: 'transport',
        resource_id: TRANSPORT_ID,
        event_id: EVENT_ID,
        organisation_id: ORG_ID,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      },
      {
        id: 'assign-2',
        application_id: APP_PARTICIPANT_1,
        resource_type: 'activity',
        resource_id: ACTIVITY_ID,
        event_id: EVENT_ID,
        organisation_id: ORG_ID,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      },
    ];

    mockUseSecureSupabase.mockReturnValue(
      buildItineraryMockSupabase({
        viewerApplicationId: APP_PARTICIPANT_1,
        assignments,
        participantALogisticsOnly: true,
      })
    );

    render(
      <MemoryRouter>
        <ItineraryContent />
      </MemoryRouter>,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Your itinerary/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Your Transport: Flight — TR100/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Your Activity: Opening session/i)).toBeInTheDocument();
  });

  it('auth / permission failure (denied role): user without itinerary read sees AccessDenied', () => {
    mockPageCan(false, false);

    render(
      <MemoryRouter initialEntries={['/itinerary']}>
        <ItineraryPage />
      </MemoryRouter>,
      { wrapper: createQueryWrapper() }
    );

    expect(screen.getByText(/do not have permission to view this page/i)).toBeInTheDocument();
  });

  it('RLS isolation (participant role): participant A sees only assigned transport, not other assignments', async () => {
    const assignments: AssignmentRow[] = [
      {
        id: 'assign-1',
        application_id: APP_PARTICIPANT_1,
        resource_type: 'transport',
        resource_id: TRANSPORT_ID,
        event_id: EVENT_ID,
        organisation_id: ORG_ID,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      },
      {
        id: 'assign-other',
        application_id: 'app-participant-2',
        resource_type: 'activity',
        resource_id: ACTIVITY_ID,
        event_id: EVENT_ID,
        organisation_id: ORG_ID,
        notes: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
      },
    ];

    mockUseSecureSupabase.mockReturnValue(
      buildItineraryMockSupabase({
        viewerApplicationId: APP_PARTICIPANT_1,
        assignments,
        participantALogisticsOnly: true,
      })
    );

    render(
      <MemoryRouter>
        <ItineraryContent />
      </MemoryRouter>,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Your Transport: Flight — TR100/i).length).toBeGreaterThan(0);
    });

    expect(screen.queryByText(/Your Activity: Opening session/i)).not.toBeInTheDocument();
  });

  it('planner role: shows event itinerary section title', async () => {
    mockPageCan(true, true);
    mockUseSecureSupabase.mockReturnValue(
      buildItineraryMockSupabase({
        viewerApplicationId: null,
        assignments: [],
      })
    );

    render(
      <MemoryRouter>
        <ItineraryContent />
      </MemoryRouter>,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Event itinerary/i)).toBeInTheDocument();
    });
  });

  it('day visitor role: shows explanatory state instead of silent empty', async () => {
    mockPageCan(false, true);
    mockUseSecureSupabase.mockReturnValue(
      buildItineraryMockSupabase({
        viewerApplicationId: null,
        assignments: [],
      })
    );

    render(
      <MemoryRouter>
        <ItineraryContent />
      </MemoryRouter>,
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/Personalised itinerary unavailable/i)).toBeInTheDocument();
    });
  });
});
