import { describe, expect, it } from 'vitest';
import {
  placeToTransportArrivalSnapshot,
  placeToTransportDepartureSnapshot,
  rowToPlanningPlace,
} from '@/features/planning/location-snapshot';

describe('location-snapshot', () => {
  it('maps place to transport departure snapshot fields', () => {
    const snapshot = placeToTransportDepartureSnapshot({
      placeId: 'place-1',
      displayName: 'Sydney Airport',
      shortAddress: 'SYD',
      coordinates: { lat: -33.9, lng: 151.2 },
      timezone: 'Australia/Sydney',
    });
    expect(snapshot).toEqual({
      departure_place_id: 'place-1',
      departure_display_name: 'Sydney Airport',
      departure_short_address: 'SYD',
      departure_coords: { lat: -33.9, lng: 151.2 },
      departure_timezone: 'Australia/Sydney',
    });
  });

  it('clears snapshot fields when place is null', () => {
    expect(placeToTransportArrivalSnapshot(null).arrival_place_id).toBeNull();
  });

  it('rehydrates planning place from row fields', () => {
    const place = rowToPlanningPlace(
      'p1',
      'Melbourne',
      'MEL',
      { lat: -37.8, lng: 144.9 },
      'Australia/Melbourne'
    );
    expect(place?.placeId).toBe('p1');
    expect(place?.displayName).toBe('Melbourne');
    expect(place?.coordinates).toEqual({ lat: -37.8, lng: 144.9 });
  });
});
