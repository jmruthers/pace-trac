/**
 * TR03 integration: transport create validation, permission guard behaviour (mocked).
 */
import { describe, expect, it } from 'vitest';
import {
  buildAccommodationPayload,
  buildActivityPayload,
  buildTransportPayload,
} from '@/features/planning/build-payloads';
import { validateTracStatusForSubmit, validateCapacityForSubmit } from '@/features/planning/validation';
import type { TransportFormValues } from '@/features/planning/validation';

describe('planning mutations integration', () => {
  it('happy path: builds transport payload with enums, capacity, and snapshots', () => {
    const values: TransportFormValues = {
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
    expect(validateTracStatusForSubmit(values.status).ok).toBe(true);
    expect(validateCapacityForSubmit(values.capacity).ok).toBe(true);

    const payload = buildTransportPayload(
      values,
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

    expect(payload.row.mode).toBe('Flight');
    expect(payload.row.capacity).toBe(120);
    expect(payload.row.departure_place_id).toBe('dep-place');
    expect(payload.row.arrival_display_name).toBe('Heathrow');
    expect(payload.places).toHaveLength(2);
  });

  it('validation failure: invalid status rejected before save', () => {
    const statusCheck = validateTracStatusForSubmit('invalid');
    expect(statusCheck.ok).toBe(false);
    expect(statusCheck.message).toBeTruthy();
  });

  it('builds accommodation and activity payloads with location snapshots', () => {
    const accommodation = buildAccommodationPayload(
      {
        name: 'Harbour Hotel',
        check_in_time: new Date('2026-06-02T15:00:00Z'),
        check_out_time: new Date('2026-06-04T10:00:00Z'),
        status: 'planned',
        notes: '',
        booking_reference: '',
        currency: 'AUD',
        individual_cost: null,
        group_cost: 500,
        capacity: 40,
        location_label: 'Circular Quay',
      },
      {
        placeId: 'hotel-place',
        displayName: 'Circular Quay',
        coordinates: { lat: -33.86, lng: 151.21 },
        timezone: 'Australia/Sydney',
      }
    );

    expect(accommodation.row.name).toBe('Harbour Hotel');
    expect(accommodation.row.location_place_id).toBe('hotel-place');
    expect(accommodation.places).toHaveLength(1);

    const activity = buildActivityPayload(
      {
        name: 'Harbour tour',
        start_time: new Date('2026-06-02T10:00:00Z'),
        finish_time: new Date('2026-06-02T18:00:00Z'),
        status: 'confirmed',
        notes: '',
        booking_reference: '',
        currency: 'AUD',
        individual_cost: 25,
        group_cost: 0,
        capacity: 30,
        start_location_label: 'Darling Harbour',
        finish_location_label: '',
      },
      {
        placeId: 'start-place',
        displayName: 'Darling Harbour',
        coordinates: { lat: -33.87, lng: 151.2 },
        timezone: 'Australia/Sydney',
      },
      null
    );

    expect(activity.row.name).toBe('Harbour tour');
    expect(activity.row.start_location_place_id).toBe('start-place');
    expect(activity.places).toHaveLength(1);
  });
});
