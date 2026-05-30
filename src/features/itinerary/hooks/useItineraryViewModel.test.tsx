import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { AssignmentRow } from '@/features/assignments/types';
import type {
  AccommodationRow,
  ActivityRow,
  TransportRow,
} from '@/features/planning/types';
import { useItineraryViewModel } from '@/features/itinerary/hooks/useItineraryViewModel';

const mockTransport = vi.fn();
const mockAccommodation = vi.fn();
const mockActivity = vi.fn();
const mockAssignments = vi.fn();
const mockAudience = vi.fn();

vi.mock('@/features/planning/hooks/useLogisticsList', () => ({
  useTransportList: () => mockTransport(),
  useAccommodationList: () => mockAccommodation(),
  useActivityList: () => mockActivity(),
}));

vi.mock('@/features/itinerary/hooks/useEventAssignments', () => ({
  useEventAssignments: () => mockAssignments(),
}));

vi.mock('@/features/itinerary/hooks/useItineraryAudience', () => ({
  useItineraryAudience: () => mockAudience(),
}));

const baseLogistics = {
  event_id: 'event-1',
  organisation_id: 'org-1',
  status: 'planned' as const,
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
};

const transportItems: TransportRow[] = [
  {
    ...baseLogistics,
    id: 'transport-1',
    mode: 'Flight',
    transport_number: null,
    departure_time: '2026-06-01T08:00:00.000Z',
    arrival_time: '2026-06-02T14:00:00.000Z',
    departure_place_id: null,
    departure_display_name: null,
    departure_short_address: null,
    departure_coords: null,
    departure_timezone: 'Australia/Sydney',
    arrival_place_id: null,
    arrival_display_name: null,
    arrival_short_address: null,
    arrival_coords: null,
    arrival_timezone: 'Europe/London',
  },
];

const activityItems: ActivityRow[] = [
  {
    ...baseLogistics,
    id: 'activity-1',
    name: 'Tour',
    start_time: '2026-06-02T10:00:00.000Z',
    finish_time: '2026-06-02T18:00:00.000Z',
    start_location_place_id: null,
    start_location_display_name: null,
    start_location_short_address: null,
    start_location_coords: null,
    start_location_timezone: 'Europe/London',
    finish_location_place_id: null,
    finish_location_display_name: null,
    finish_location_short_address: null,
    finish_location_coords: null,
    finish_location_timezone: 'Europe/London',
  },
];

const accommodationItems: AccommodationRow[] = [
  {
    ...baseLogistics,
    id: 'accommodation-1',
    name: 'Hotel',
    check_in_time: '2026-06-02T15:00:00.000Z',
    check_out_time: '2026-06-04T10:00:00.000Z',
    location_place_id: null,
    location_display_name: null,
    location_short_address: null,
    location_coords: null,
    location_timezone: 'Europe/London',
  },
];

const assignmentRows: AssignmentRow[] = [
  {
    id: 'assign-1',
    application_id: 'app-participant-1',
    resource_type: 'transport',
    resource_id: 'transport-1',
    event_id: 'event-1',
    organisation_id: 'org-1',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: null,
    updated_by: null,
  },
  {
    id: 'assign-2',
    application_id: 'app-participant-1',
    resource_type: 'activity',
    resource_id: 'activity-1',
    event_id: 'event-1',
    organisation_id: 'org-1',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: null,
    updated_by: null,
  },
];

function listState<T>(items: T[]) {
  return {
    items,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe('useItineraryViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransport.mockReturnValue(listState(transportItems));
    mockAccommodation.mockReturnValue(listState(accommodationItems));
    mockActivity.mockReturnValue(listState(activityItems));
    mockAssignments.mockReturnValue({
      assignments: assignmentRows,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it('planner tab all: builds model with full event scope', () => {
    mockAudience.mockReturnValue({
      mode: 'planner',
      participantApplicationId: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useItineraryViewModel('event'));

    expect(result.current.model).not.toBeNull();
    expect(result.current.model?.dayGroups.length).toBeGreaterThan(0);
    expect(result.current.isError).toBe(false);
  });

  it('participant: forces personal scope and narrows assigned resources', () => {
    mockAudience.mockReturnValue({
      mode: 'participant',
      participantApplicationId: 'app-participant-1',
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useItineraryViewModel('event'));

    const resourceIds = new Set(
      result.current.model?.dayGroups.flatMap((g) => g.entries.map((e) => e.resourceId)) ?? []
    );
    expect(resourceIds.has('transport-1')).toBe(true);
    expect(resourceIds.has('activity-1')).toBe(true);
    expect(resourceIds.has('accommodation-1')).toBe(false);
  });

  it('day visitor: no itinerary model', () => {
    mockAudience.mockReturnValue({
      mode: 'day_visitor',
      participantApplicationId: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    const { result } = renderHook(() => useItineraryViewModel('event'));

    expect(result.current.model).toBeNull();
  });
});
