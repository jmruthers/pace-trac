/**
 * SLICE-10 master plan integration tests (TR10 testing requirements).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { computeCostRollup } from '@/features/costs/cost-rollup';
import type { ItineraryModel } from '@/features/itinerary/types';
import type { Contact } from '@/features/contacts/types';
import type { TransportRow } from '@/features/planning/types';

const mockUsePageCan = vi.fn();
const mockUseCostRollupData = vi.fn();

const EVENT_ID = 'event-1';
const ORG_ID = 'org-1';

const mockRollup = computeCostRollup({
  baseCurrency: 'USD',
  approvedParticipantCount: 2,
  rates: [{ currency_code: 'USD', exchange_rate: 1 }],
  assignments: [
    {
      resource_type: 'transport',
      resource_id: 't1',
      application_id: 'app-1',
    },
  ],
  lines: [
    {
      resourceType: 'transport',
      resourceId: 't1',
      currency: 'USD',
      individual_cost: 10,
      group_cost: 20,
      label: 'Flight',
    },
  ],
});

const mockHeader = {
  eventName: 'Summer Tour',
  dateRangeLabel: '21 May 2026 – 25 May 2026',
  logoFileReference: null,
};

const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    event_id: EVENT_ID,
    organisation_id: ORG_ID,
    first_name: 'Jamie',
    surname: 'Guide',
    role: 'Tour lead',
    phone_number: null,
    email_address: 'jamie@example.com',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: null,
    updated_by: null,
  },
];

const transportRow: TransportRow = {
  id: 'transport-1',
  event_id: EVENT_ID,
  organisation_id: ORG_ID,
  status: null,
  notes: null,
  booking_reference: null,
  currency: null,
  individual_cost: null,
  group_cost: null,
  mode: 'Flight',
  transport_number: 'AB123',
  departure_time: '2026-05-21T08:00:00Z',
  arrival_time: '2026-05-21T12:00:00Z',
  departure_timezone: 'UTC',
  arrival_timezone: 'UTC',
  departure_display_name: 'Origin Airport',
  arrival_display_name: 'Destination Airport',
  departure_short_address: null,
  arrival_short_address: null,
  departure_coords: { lat: -33.86, lng: 151.21 },
  arrival_coords: { lat: -37.81, lng: 144.96 },
  departure_place_id: null,
  arrival_place_id: null,
  capacity: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
  updated_by: null,
};

const mockItineraryModel: ItineraryModel = {
  dayGroups: [
    {
      dayKey: '2026-05-21',
      entries: [
        {
          dayKey: '2026-05-21',
          localDate: '2026-05-21',
          resourceType: 'transport',
          resourceId: 'transport-1',
          entryKind: 'departure',
          orderingTimestamp: '2026-05-21T08:00:00.000Z',
          orderingEpochMs: Date.parse('2026-05-21T08:00:00.000Z'),
          sortCategory: 'timestamp',
          timezone: 'UTC',
          timezoneSource: 'departure_timezone',
        },
      ],
    },
  ],
  displayByResourceKey: {
    'transport:transport-1': {
      resourceType: 'transport',
      resourceId: 'transport-1',
      title: 'flight — AB123',
      subtitle: 'Origin Airport → Destination Airport',
      coords: [
        { label: 'Origin Airport', coordinates: { lat: -33.86, lng: 151.21 } },
        { label: 'Destination Airport', coordinates: { lat: -37.81, lng: 144.96 } },
      ],
    },
  },
  skippedResources: [],
  visibleDateRange: { startDayKey: '2026-05-21', endDayKey: '2026-05-21' },
};

vi.mock('@solvera/pace-core/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/hooks')>();
  return {
    ...actual,
    usePaceMain: vi.fn(),
    useFileDisplay: () => ({ url: null, isLoading: false, error: null }),
    useOptionalEvents: () => ({
      selectedEvent: { id: EVENT_ID, organisation_id: ORG_ID },
      isLoading: false,
    }),
    useEvents: () => ({
      selectedEvent: { id: EVENT_ID, organisation_id: ORG_ID, event_name: 'Summer Tour' },
      isLoading: false,
    }),
  };
});

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
    useSecureSupabase: () => null,
    useResolvedScope: () => ({
      eventId: EVENT_ID,
      organisationId: ORG_ID,
      isLoading: false,
    }),
    PagePermissionGuard: ({
      children,
      fallback,
      pageName,
    }: {
      children: ReactNode;
      fallback?: ReactNode;
      pageName: string;
    }) => {
      const { can, isLoading } = mockUsePageCan(pageName, 'read');
      if (isLoading) return null;
      if (!can) return fallback ?? null;
      return children;
    },
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

vi.mock('@/features/master-plan/hooks/useMasterPlanEventHeader', () => ({
  useMasterPlanEventHeader: () => ({
    header: mockHeader,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/costs/hooks/useCostRollupData', () => ({
  useCostRollupData: () => mockUseCostRollupData(),
}));

vi.mock('@/features/contacts/hooks/use-contacts', () => ({
  useContacts: () => ({
    contacts: mockContacts,
    isLoading: false,
    error: null,
    refreshContacts: vi.fn(),
    addContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  }),
}));

vi.mock('@/features/itinerary/hooks/useItineraryViewModel', () => ({
  useItineraryViewModel: () => ({
    audience: { mode: 'planner' as const, canReadPlanning: true, participantApplicationId: null },
    model: mockItineraryModel,
    isLoading: false,
    isError: false,
    error: null,
    transportItems: [transportRow],
    accommodationItems: [],
    activityItems: [],
  }),
}));

vi.mock('@/features/planning/hooks/useLogisticsList', () => ({
  useTransportList: () => ({
    items: [transportRow],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useAccommodationList: () => ({
    items: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useActivityList: () => ({
    items: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  return {
    ...actual,
    DataTable: ({ data }: { data: unknown[] }) => (
      <table>
        <tbody>
          {data.map((row, index) => {
            const record = row as Record<string, unknown>;
            const key = String(record.resourceId ?? record.applicationId ?? index);
            return (
              <tr key={key}>
                <td>{String(record.resourceLabel ?? record.participantLabel ?? '')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
  };
});

import { MasterPlanPage } from '@/app/pages/MasterPlanPage';

describe('master plan integration (TR10)', () => {
  beforeEach(() => {
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
    mockUseCostRollupData.mockReturnValue({
      rollup: mockRollup,
      baseCurrency: 'USD',
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(cleanup);

  it('happy path: planner sees all master plan sections populated from mocks', () => {
    render(
      <MemoryRouter initialEntries={['/masterplan']}>
        <MasterPlanPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Master Plan' })).toBeInTheDocument();
    expect(screen.getByText('Summer Tour')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Journey map' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Costs' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage currency rates' })).not.toBeInTheDocument();
    expect(screen.getByText(/Event cost summary for 2 approved participants/)).toBeInTheDocument();
    expect(screen.getByText(/Jamie/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Detailed itinerary' })).toBeInTheDocument();
    expect(
      screen.getByText(/Schedule days use timezone snapshots saved on each logistics row/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument();
  });

  it('validation / domain failure: costs error does not suppress other sections', () => {
    mockUseCostRollupData.mockReturnValue({
      rollup: null,
      baseCurrency: null,
      isLoading: false,
      isError: true,
      error: 'Costs unavailable',
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/masterplan']}>
        <MasterPlanPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Costs unavailable')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Detailed itinerary' })).toBeInTheDocument();
  });

  it('auth / permission failure: user without masterplan read sees denial', () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/masterplan']}>
        <MasterPlanPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/do not have permission to view this page/i)).toBeInTheDocument();
  });
});
