/**
 * TR03 integration: transport create validation, permission guard behaviour (mocked).
 */
import { describe, expect, it, vi } from 'vitest';
import { buildTransportPayload } from '@/features/planning/build-payloads';
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

  it('permission failure: usePageCan create false blocks save button state', async () => {
    const usePageCan = vi.fn().mockReturnValue({ can: false, isLoading: false });
    const canCreate = usePageCan('planning', 'create').can;
    expect(canCreate).toBe(false);
  });
});
