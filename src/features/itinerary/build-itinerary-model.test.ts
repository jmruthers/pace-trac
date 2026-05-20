import { describe, expect, it } from 'vitest';
import {
  deriveItineraryDayEntries,
  getItineraryVisibleDateRange,
  groupItineraryEntriesByDay,
} from '@solvera/pace-core/itinerary';
import { buildItineraryModel } from '@/features/itinerary/build-itinerary-model';
import {
  CANONICAL_ITINERARY_ASSIGNMENTS,
  CANONICAL_ITINERARY_RESOURCES,
  INVALID_TRANSPORT_RESOURCE,
  SAME_DAY_ACCOMMODATION,
  TRANSPORT_ARRIVAL_TZ_FALLBACK,
} from '@/features/itinerary/itinerary-fixtures';

describe('buildItineraryModel (CR25 contract)', () => {
  it('derives multi-day transport, activity, and accommodation day groups via CR25', () => {
    const model = buildItineraryModel({
      resources: CANONICAL_ITINERARY_RESOURCES,
      assignments: CANONICAL_ITINERARY_ASSIGNMENTS,
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
      displayByResourceKey: {},
    });

    const directEntries = deriveItineraryDayEntries({
      resources: CANONICAL_ITINERARY_RESOURCES,
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
    });

    expect(model.dayGroups).toEqual(groupItineraryEntriesByDay(directEntries));
    expect(model.visibleDateRange).toEqual(getItineraryVisibleDateRange(directEntries));
    expect(model.dayGroups.length).toBeGreaterThan(1);
  });

  it('participant narrowing returns only assigned resources', () => {
    const model = buildItineraryModel({
      resources: CANONICAL_ITINERARY_RESOURCES,
      assignments: CANONICAL_ITINERARY_ASSIGNMENTS,
      scope: { mode: 'participant', participantApplicationId: 'app-participant-1' },
      eventDefaultTimezone: null,
      displayByResourceKey: {},
    });

    const resourceIds = new Set(
      model.dayGroups.flatMap((g) => g.entries.map((e) => e.resourceId))
    );
    expect(resourceIds.has('transport-1')).toBe(true);
    expect(resourceIds.has('activity-1')).toBe(true);
    expect(resourceIds.has('accommodation-1')).toBe(false);
  });

  it('validation failure: skips invalid resource and keeps stable ordering for valid subset', () => {
    const resources = [...CANONICAL_ITINERARY_RESOURCES, INVALID_TRANSPORT_RESOURCE];
    const model = buildItineraryModel({
      resources,
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
      displayByResourceKey: {},
    });

    expect(model.skippedResources).toHaveLength(1);
    expect(model.skippedResources[0]?.resourceId).toBe('transport-bad');

    const validOnly = buildItineraryModel({
      resources: CANONICAL_ITINERARY_RESOURCES,
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
      displayByResourceKey: {},
    });

    expect(model.dayGroups).toEqual(validOnly.dayGroups);
    expect(model.visibleDateRange).toEqual(validOnly.visibleDateRange);
  });

  it('timezone precedence: arrival day uses departure timezone when arrival TZ missing', () => {
    const entries = deriveItineraryDayEntries({
      resources: [TRANSPORT_ARRIVAL_TZ_FALLBACK],
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
    });

    const arrivalEntry = entries.find((e) => e.entryKind === 'arrival');
    expect(arrivalEntry?.timezoneSource).toBe('departure_timezone');
  });

  it('in-day ordering: transport departure sorts before activity start on shared day', () => {
    const resources = [
      {
        resourceType: 'activity' as const,
        resourceId: 'activity-order',
        startTime: '2026-06-02T18:00:00.000Z',
        finishTime: '2026-06-02T20:00:00.000Z',
        startTimezone: 'Europe/London',
        finishTimezone: 'Europe/London',
      },
      {
        resourceType: 'transport' as const,
        resourceId: 'transport-order',
        departureTime: '2026-06-02T08:00:00.000Z',
        arrivalTime: '2026-06-02T10:00:00.000Z',
        departureTimezone: 'Europe/London',
        arrivalTimezone: 'Europe/London',
      },
    ];

    const model = buildItineraryModel({
      resources,
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
      displayByResourceKey: {},
    });

    const day = model.dayGroups.find((g) => g.dayKey === '2026-06-02');
    expect(day?.entries[0]?.resourceId).toBe('transport-order');
    expect(day?.entries[0]?.entryKind).toBe('departure');
  });

  it('same-day accommodation produces single check-in entry per CR25', () => {
    const entries = deriveItineraryDayEntries({
      resources: [SAME_DAY_ACCOMMODATION],
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
    });

    const sameDay = entries.filter((e) => e.dayKey === '2026-06-03');
    expect(sameDay).toHaveLength(1);
    expect(sameDay[0]?.entryKind).toBe('check-in');
  });

  it('shared-helper parity: canonical fixtures match direct CR25 grouping and range', () => {
    const model = buildItineraryModel({
      resources: CANONICAL_ITINERARY_RESOURCES,
      assignments: CANONICAL_ITINERARY_ASSIGNMENTS,
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
      displayByResourceKey: {},
    });

    const entries = deriveItineraryDayEntries({
      resources: CANONICAL_ITINERARY_RESOURCES,
      assignments: CANONICAL_ITINERARY_ASSIGNMENTS,
      scope: { mode: 'all' },
      eventDefaultTimezone: null,
    });

    expect(model.dayGroups).toEqual(groupItineraryEntriesByDay(entries));
    expect(model.visibleDateRange).toEqual(getItineraryVisibleDateRange(entries));
  });
});
