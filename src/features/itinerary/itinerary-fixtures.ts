import type {
  ItineraryAssignmentInput,
  ItineraryResourceInput,
} from '@solvera/pace-core/itinerary';

/** Canonical mixed logistics inputs for TR05 parity / verification tests. */
export const CANONICAL_ITINERARY_RESOURCES: ItineraryResourceInput[] = [
  {
    resourceType: 'transport',
    resourceId: 'transport-1',
    departureTime: '2026-06-01T08:00:00.000Z',
    arrivalTime: '2026-06-02T14:00:00.000Z',
    departureTimezone: 'Australia/Sydney',
    arrivalTimezone: 'Europe/London',
  },
  {
    resourceType: 'activity',
    resourceId: 'activity-1',
    startTime: '2026-06-02T10:00:00.000Z',
    finishTime: '2026-06-02T18:00:00.000Z',
    startTimezone: 'Europe/London',
    finishTimezone: 'Europe/London',
  },
  {
    resourceType: 'accommodation',
    resourceId: 'accommodation-1',
    checkInTime: '2026-06-02T15:00:00.000Z',
    checkOutTime: '2026-06-04T10:00:00.000Z',
    timezone: 'Europe/London',
  },
];

export const CANONICAL_ITINERARY_ASSIGNMENTS: ItineraryAssignmentInput[] = [
  {
    resourceType: 'transport',
    resourceId: 'transport-1',
    participantApplicationId: 'app-participant-1',
  },
  {
    resourceType: 'activity',
    resourceId: 'activity-1',
    participantApplicationId: 'app-participant-1',
  },
  {
    resourceType: 'accommodation',
    resourceId: 'accommodation-1',
    participantApplicationId: 'app-participant-2',
  },
];

/** Transport where arrival day uses departure TZ fallback when arrival TZ missing. */
export const TRANSPORT_ARRIVAL_TZ_FALLBACK: ItineraryResourceInput = {
  resourceType: 'transport',
  resourceId: 'transport-tz-fallback',
  departureTime: '2026-06-01T08:00:00.000Z',
  arrivalTime: '2026-06-03T14:00:00.000Z',
  departureTimezone: 'Australia/Sydney',
  arrivalTimezone: null,
};

/** Same local day check-in and check-out (Europe/London). */
export const SAME_DAY_ACCOMMODATION: ItineraryResourceInput = {
  resourceType: 'accommodation',
  resourceId: 'accommodation-same-day',
  checkInTime: '2026-06-03T09:00:00.000Z',
  checkOutTime: '2026-06-03T21:00:00.000Z',
  timezone: 'Europe/London',
};

export const INVALID_TRANSPORT_RESOURCE: ItineraryResourceInput = {
  resourceType: 'transport',
  resourceId: 'transport-bad',
  departureTime: 'not-a-date',
  arrivalTime: '2026-06-03T10:00:00.000Z',
  departureTimezone: 'Australia/Sydney',
  arrivalTimezone: 'Australia/Sydney',
};
