/**
 * TR03: integration for logistics create via useTransportMutations (mock Supabase).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildTransportPayload } from '@/features/planning/build-payloads';
import type { TransportFormValues } from '@/features/planning/validation';

const mockUseSecureSupabase = vi.fn();
const mockUseResolvedScope = vi.fn();
const mockInvalidate = vi.fn();
const mockWriteCache = vi.fn();

const mockUseOptionalEvents = vi.fn(() => ({
  selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
  isLoading: false,
}));

vi.mock('@solvera/pace-core/hooks', () => ({
  useOptionalEvents: () => mockUseOptionalEvents(),
}));

vi.mock('@solvera/pace-core/rbac', () => ({
  useSecureSupabase: () => mockUseSecureSupabase(),
  useResolvedScope: () => mockUseResolvedScope(),
  usePageCan: vi.fn(),
}));

vi.mock('@/features/planning/invalidation', () => ({
  invalidatePlanningAndDependents: (...args: unknown[]) => mockInvalidate(...args),
}));

vi.mock('@/features/planning/location-cache', () => ({
  writeLocationCacheBestEffort: (...args: unknown[]) => mockWriteCache(...args),
}));

import { useTransportMutations } from '@/features/planning/hooks/useLogisticsMutations';

const EVENT_ID = 'event-1';
const ORG_ID = 'org-1';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const transportValues: TransportFormValues = {
  mode: 'Flight',
  transport_number: 'QF1',
  departure_time: new Date('2026-06-01T06:00:00Z'),
  arrival_time: new Date('2026-06-01T14:00:00Z'),
  departure_label: 'Sydney',
  arrival_label: 'London',
  status: 'planned',
  notes: '',
  booking_reference: 'BR123',
  currency: 'AUD',
  individual_cost: 100,
  group_cost: null,
  capacity: 120,
};

function buildTransportMockSupabase() {
  let inserted: Record<string, unknown> | null = null;

  return {
    from: vi.fn((table: string) => {
      if (table !== 'trac_transport') {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        insert: vi.fn((row: Record<string, unknown>) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              inserted = row;
              return {
                data: { ...row, id: 'transport-new' },
                error: null,
              };
            }),
          })),
        })),
      };
    }),
    getInserted: () => inserted,
  };
}

describe('useLogisticsMutations integration (TR03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidate.mockResolvedValue(undefined);
    mockWriteCache.mockResolvedValue(undefined);
    mockUseOptionalEvents.mockImplementation(() => ({
      selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
      isLoading: false,
    }));
    mockUseResolvedScope.mockReturnValue({
      eventId: 'event-1',
      organisationId: 'org-1',
      appId: 'app-1',
      isLoading: false,
    });
  });

  it('happy path: createItem persists transport with snapshots and event scope', async () => {
    const supabase = buildTransportMockSupabase();
    mockUseSecureSupabase.mockReturnValue(supabase);

    const { row, places } = buildTransportPayload(
      transportValues,
      {
        placeId: 'dep-place',
        displayName: 'Sydney Airport',
        coordinates: { lat: -33.9, lng: 151.2 },
        timezone: 'Australia/Sydney',
      },
      {
        placeId: 'arr-place',
        displayName: 'Heathrow',
        coordinates: { lat: 51.5, lng: -0.45 },
        timezone: 'Europe/London',
      }
    );

    const { result } = renderHook(() => useTransportMutations(), {
      wrapper: createWrapper(),
    });

    await result.current.createItem({ row, places });

    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalled();
    });

    const inserted = supabase.getInserted();
    expect(inserted).not.toBeNull();
    expect(inserted?.event_id).toBe(EVENT_ID);
    expect(inserted?.organisation_id).toBe(ORG_ID);
    expect(inserted?.departure_place_id).toBe('dep-place');
    expect(inserted?.arrival_display_name).toBe('Heathrow');
    expect(inserted?.capacity).toBe(120);
    expect(mockWriteCache).toHaveBeenCalled();
  });

  it('validation failure: rejects when event scope is not ready', async () => {
    mockUseSecureSupabase.mockReturnValue(buildTransportMockSupabase());
    mockUseOptionalEvents.mockImplementation(
      () =>
        ({
          selectedEvent: undefined,
          isLoading: false,
        }) as unknown as ReturnType<typeof mockUseOptionalEvents>
    );
    mockUseResolvedScope.mockReturnValue({
      eventId: null,
      organisationId: null,
      appId: null,
      isLoading: false,
    });

    const { row } = buildTransportPayload(transportValues, null, null);

    const { result } = renderHook(() => useTransportMutations(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.createItem({ row })).rejects.toThrow(/event scope is not ready/i);
  });
});
