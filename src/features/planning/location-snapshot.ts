import type { PlanningPlaceValue } from '@/features/planning/types';

export function coordsToJson(coords: PlanningPlaceValue['coordinates']): { lat: number; lng: number } | null {
  if (coords == null || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return null;
  }
  return { lat: coords.lat, lng: coords.lng };
}

export function parseCoordsFromRow(value: unknown): PlanningPlaceValue['coordinates'] | null {
  if (value == null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const lat = record.lat;
  const lng = record.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng };
  }
  return null;
}

export function placeToTransportDepartureSnapshot(place: PlanningPlaceValue | null) {
  if (place == null) {
    return {
      departure_place_id: null,
      departure_display_name: null,
      departure_short_address: null,
      departure_coords: null,
      departure_timezone: null,
    };
  }
  return {
    departure_place_id: place.placeId,
    departure_display_name: place.displayName,
    departure_short_address: place.shortAddress ?? null,
    departure_coords: coordsToJson(place.coordinates),
    departure_timezone: place.timezone ?? null,
  };
}

export function placeToTransportArrivalSnapshot(place: PlanningPlaceValue | null) {
  if (place == null) {
    return {
      arrival_place_id: null,
      arrival_display_name: null,
      arrival_short_address: null,
      arrival_coords: null,
      arrival_timezone: null,
    };
  }
  return {
    arrival_place_id: place.placeId,
    arrival_display_name: place.displayName,
    arrival_short_address: place.shortAddress ?? null,
    arrival_coords: coordsToJson(place.coordinates),
    arrival_timezone: place.timezone ?? null,
  };
}

export function placeToAccommodationSnapshot(place: PlanningPlaceValue | null) {
  if (place == null) {
    return {
      location_place_id: null,
      location_display_name: null,
      location_short_address: null,
      location_coords: null,
      location_timezone: null,
    };
  }
  return {
    location_place_id: place.placeId,
    location_display_name: place.displayName,
    location_short_address: place.shortAddress ?? null,
    location_coords: coordsToJson(place.coordinates),
    location_timezone: place.timezone ?? null,
  };
}

export function placeToActivityStartSnapshot(place: PlanningPlaceValue | null) {
  if (place == null) {
    return {
      start_location_place_id: null,
      start_location_display_name: null,
      start_location_short_address: null,
      start_location_coords: null,
      start_location_timezone: null,
    };
  }
  return {
    start_location_place_id: place.placeId,
    start_location_display_name: place.displayName,
    start_location_short_address: place.shortAddress ?? null,
    start_location_coords: coordsToJson(place.coordinates),
    start_location_timezone: place.timezone ?? null,
  };
}

export function placeToActivityFinishSnapshot(place: PlanningPlaceValue | null) {
  if (place == null) {
    return {
      finish_location_place_id: null,
      finish_location_display_name: null,
      finish_location_short_address: null,
      finish_location_coords: null,
      finish_location_timezone: null,
    };
  }
  return {
    finish_location_place_id: place.placeId,
    finish_location_display_name: place.displayName,
    finish_location_short_address: place.shortAddress ?? null,
    finish_location_coords: coordsToJson(place.coordinates),
    finish_location_timezone: place.timezone ?? null,
  };
}

export function rowToPlanningPlace(
  placeId: string | null | undefined,
  displayName: string | null | undefined,
  shortAddress: string | null | undefined,
  coords: unknown,
  timezone: string | null | undefined
): PlanningPlaceValue | null {
  const parsed = parseCoordsFromRow(coords);
  if (!placeId && !displayName && !parsed) return null;
  return {
    placeId: placeId ?? '',
    displayName: displayName ?? shortAddress ?? '',
    shortAddress: shortAddress ?? undefined,
    coordinates: parsed ?? undefined,
    timezone: timezone ?? undefined,
  };
}
