import { buildTransportDisplay } from '@/features/itinerary/map-logistics-to-itinerary-input';
import type { ItineraryMapData } from '@/features/itinerary/collect-map-points';
import type { TransportRow } from '@/features/planning/types';

function coordKey(coords: { lat: number; lng: number }): string {
  return `${coords.lat},${coords.lng}`;
}

/** Transport-only map points and legs from logistics snapshot coordinates. */
export function collectTransportJourneyMapData(transport: readonly TransportRow[]): ItineraryMapData {
  const seenCoords = new Set<string>();
  const points: ItineraryMapData['points'] = [];
  const transportLegs: ItineraryMapData['transportLegs'] = [];

  for (const row of transport) {
    const display = buildTransportDisplay(row);
    if (display.coords.length >= 2) {
      transportLegs.push({
        resourceId: display.resourceId,
        from: display.coords[0]!,
        to: display.coords[1]!,
      });
    }
    for (const point of display.coords) {
      const key = coordKey(point.coordinates);
      if (seenCoords.has(key)) continue;
      seenCoords.add(key);
      points.push(point);
    }
  }

  return { points, transportLegs };
}
