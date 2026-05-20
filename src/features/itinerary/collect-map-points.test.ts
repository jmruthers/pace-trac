import { describe, expect, it } from 'vitest';
import { deriveItineraryDayEntries, groupItineraryEntriesByDay } from '@solvera/pace-core/itinerary';
import { buildDisplayByResourceKey } from '@/features/itinerary/map-logistics-to-itinerary-input';
import { collectMapData } from '@/features/itinerary/collect-map-points';
import type { TransportRow } from '@/features/planning/types';

const transportRow: TransportRow = {
  id: 'transport-map',
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
  departure_coords: { lat: -33.9, lng: 151.2 },
  departure_timezone: 'Australia/Sydney',
  arrival_place_id: null,
  arrival_display_name: 'London',
  arrival_short_address: null,
  arrival_coords: { lat: 51.5, lng: -0.1 },
  arrival_timezone: 'Europe/London',
};

describe('collectMapData', () => {
  it('collects transport leg when departure and arrival coords exist', () => {
    const display = buildDisplayByResourceKey({
      transport: [transportRow],
      accommodation: [],
      activity: [],
    });
    const entries = deriveItineraryDayEntries({
      resources: [
        {
          resourceType: 'transport',
          resourceId: transportRow.id,
          departureTime: transportRow.departure_time,
          arrivalTime: transportRow.arrival_time,
          departureTimezone: transportRow.departure_timezone,
          arrivalTimezone: transportRow.arrival_timezone,
        },
      ],
      scope: { mode: 'all' },
    });
    const dayGroups = groupItineraryEntriesByDay(entries);
    const { transportLegs, points } = collectMapData(dayGroups, display);

    expect(transportLegs).toHaveLength(1);
    expect(transportLegs[0]?.from.label).toBe('Sydney');
    expect(transportLegs[0]?.to.label).toBe('London');
    expect(points.length).toBeGreaterThanOrEqual(2);
  });
});
