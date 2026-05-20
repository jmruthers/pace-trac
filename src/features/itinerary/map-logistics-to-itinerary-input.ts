import type {
  ItineraryAssignmentInput,
  ItineraryResourceInput,
} from '@solvera/pace-core/itinerary';
import type { AssignmentRow } from '@/features/assignments/types';
import type {
  AccommodationRow,
  ActivityRow,
  LogisticsResourceKind,
  TransportRow,
} from '@/features/planning/types';
import type { ItineraryResourceDisplay } from '@/features/itinerary/types';

function resourceKey(resourceType: LogisticsResourceKind, resourceId: string): string {
  return `${resourceType}:${resourceId}`;
}

export function mapTransportToItineraryInput(row: TransportRow): ItineraryResourceInput {
  return {
    resourceType: 'transport',
    resourceId: row.id,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    departureTimezone: row.departure_timezone,
    arrivalTimezone: row.arrival_timezone,
  };
}

export function mapActivityToItineraryInput(row: ActivityRow): ItineraryResourceInput {
  return {
    resourceType: 'activity',
    resourceId: row.id,
    startTime: row.start_time,
    finishTime: row.finish_time,
    startTimezone: row.start_location_timezone,
    finishTimezone: row.finish_location_timezone,
  };
}

export function mapAccommodationToItineraryInput(row: AccommodationRow): ItineraryResourceInput {
  return {
    resourceType: 'accommodation',
    resourceId: row.id,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    timezone: row.location_timezone,
  };
}

export function mapAssignmentsToItineraryInput(rows: AssignmentRow[]): ItineraryAssignmentInput[] {
  return rows.map((row) => ({
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    participantApplicationId: row.application_id,
  }));
}

export function buildTransportDisplay(row: TransportRow): ItineraryResourceDisplay {
  const dep = row.departure_display_name ?? row.departure_short_address ?? 'Departure';
  const arr = row.arrival_display_name ?? row.arrival_short_address ?? 'Arrival';
  const coords = [];
  if (row.departure_coords) {
    coords.push({ label: dep, coordinates: row.departure_coords });
  }
  if (row.arrival_coords) {
    coords.push({ label: arr, coordinates: row.arrival_coords });
  }
  const modeLabel = row.transport_number ? `${row.mode} — ${row.transport_number}` : row.mode;
  return {
    resourceType: 'transport',
    resourceId: row.id,
    title: modeLabel,
    subtitle: `${dep} → ${arr}`,
    coords,
  };
}

export function buildActivityDisplay(row: ActivityRow): ItineraryResourceDisplay {
  const start = row.start_location_display_name ?? row.start_location_short_address ?? 'Start';
  const finish = row.finish_location_display_name ?? row.finish_location_short_address ?? 'Finish';
  const coords = [];
  if (row.start_location_coords) {
    coords.push({ label: start, coordinates: row.start_location_coords });
  }
  if (row.finish_location_coords) {
    coords.push({ label: finish, coordinates: row.finish_location_coords });
  }
  return {
    resourceType: 'activity',
    resourceId: row.id,
    title: row.name,
    subtitle: start === finish ? start : `${start} → ${finish}`,
    coords,
  };
}

export function buildAccommodationDisplay(row: AccommodationRow): ItineraryResourceDisplay {
  const location = row.location_display_name ?? row.location_short_address ?? 'Location';
  const coords = row.location_coords ? [{ label: location, coordinates: row.location_coords }] : [];
  return {
    resourceType: 'accommodation',
    resourceId: row.id,
    title: row.name,
    subtitle: location,
    coords,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
  };
}

export function buildDisplayByResourceKey(params: {
  transport: TransportRow[];
  accommodation: AccommodationRow[];
  activity: ActivityRow[];
}): Record<string, ItineraryResourceDisplay> {
  const map: Record<string, ItineraryResourceDisplay> = {};
  for (const row of params.transport) {
    map[resourceKey('transport', row.id)] = buildTransportDisplay(row);
  }
  for (const row of params.accommodation) {
    map[resourceKey('accommodation', row.id)] = buildAccommodationDisplay(row);
  }
  for (const row of params.activity) {
    map[resourceKey('activity', row.id)] = buildActivityDisplay(row);
  }
  return map;
}

export function mapLogisticsToItineraryResources(params: {
  transport: TransportRow[];
  accommodation: AccommodationRow[];
  activity: ActivityRow[];
}): ItineraryResourceInput[] {
  return [
    ...params.transport.map(mapTransportToItineraryInput),
    ...params.accommodation.map(mapAccommodationToItineraryInput),
    ...params.activity.map(mapActivityToItineraryInput),
  ];
}

export { resourceKey };
