import {
  placeToAccommodationSnapshot,
  placeToActivityFinishSnapshot,
  placeToActivityStartSnapshot,
  placeToTransportArrivalSnapshot,
  placeToTransportDepartureSnapshot,
} from '@/features/planning/location-snapshot';
import type { PlanningPlaceValue } from '@/features/planning/types';
import type {
  AccommodationFormValues,
  ActivityFormValues,
  TransportFormValues,
} from '@/features/planning/validation';

function normalizeCurrency(value: string | undefined): string | null {
  if (value == null || value.trim() === '') return null;
  return value.trim().slice(0, 3).toUpperCase();
}

export function buildTransportPayload(
  values: TransportFormValues,
  departure: PlanningPlaceValue | null,
  arrival: PlanningPlaceValue | null
): { row: Record<string, unknown>; places: PlanningPlaceValue[] } {
  const places = [departure, arrival].filter((p): p is PlanningPlaceValue => p != null && Boolean(p.placeId));
  return {
    places,
    row: {
      mode: values.mode,
      transport_number: values.transport_number?.trim() || null,
      departure_time: values.departure_time.toISOString(),
      arrival_time: values.arrival_time.toISOString(),
      status: values.status,
      notes: values.notes?.trim() || null,
      booking_reference: values.booking_reference?.trim() || null,
      currency: normalizeCurrency(values.currency),
      individual_cost: values.individual_cost,
      group_cost: values.group_cost,
      capacity: values.capacity,
      ...placeToTransportDepartureSnapshot(departure),
      ...placeToTransportArrivalSnapshot(arrival),
    },
  };
}

export function buildAccommodationPayload(
  values: AccommodationFormValues,
  location: PlanningPlaceValue | null
): { row: Record<string, unknown>; places: PlanningPlaceValue[] } {
  const places = location?.placeId ? [location] : [];
  return {
    places,
    row: {
      name: values.name.trim(),
      check_in_time: values.check_in_time.toISOString(),
      check_out_time: values.check_out_time.toISOString(),
      status: values.status,
      notes: values.notes?.trim() || null,
      booking_reference: values.booking_reference?.trim() || null,
      currency: normalizeCurrency(values.currency),
      individual_cost: values.individual_cost,
      group_cost: values.group_cost,
      capacity: values.capacity,
      ...placeToAccommodationSnapshot(location),
    },
  };
}

export function buildActivityPayload(
  values: ActivityFormValues,
  start: PlanningPlaceValue | null,
  finish: PlanningPlaceValue | null
): { row: Record<string, unknown>; places: PlanningPlaceValue[] } {
  const places = [start, finish].filter((p): p is PlanningPlaceValue => p != null && Boolean(p.placeId));
  return {
    places,
    row: {
      name: values.name.trim(),
      start_time: values.start_time.toISOString(),
      finish_time: values.finish_time.toISOString(),
      status: values.status,
      notes: values.notes?.trim() || null,
      booking_reference: values.booking_reference?.trim() || null,
      currency: normalizeCurrency(values.currency),
      individual_cost: values.individual_cost,
      group_cost: values.group_cost,
      capacity: values.capacity,
      ...placeToActivityStartSnapshot(start),
      ...placeToActivityFinishSnapshot(finish),
    },
  };
}
