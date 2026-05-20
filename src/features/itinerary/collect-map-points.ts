import type { ItineraryDayGroup } from '@solvera/pace-core/itinerary';
import { resourceKey } from '@/features/itinerary/map-logistics-to-itinerary-input';
import type {
  ItineraryMapPoint,
  ItineraryResourceDisplay,
  ItineraryTransportLeg,
} from '@/features/itinerary/types';

export interface ItineraryMapData {
  points: ItineraryMapPoint[];
  transportLegs: ItineraryTransportLeg[];
}

function coordKey(coords: { lat: number; lng: number }): string {
  return `${coords.lat},${coords.lng}`;
}

/** Map points and transport legs for resources visible in derived day groups. */
export function collectMapData(
  dayGroups: ItineraryDayGroup[],
  displayByResourceKey: Record<string, ItineraryResourceDisplay>
): ItineraryMapData {
  const seenResources = new Set<string>();
  const seenCoords = new Set<string>();
  const points: ItineraryMapPoint[] = [];
  const transportLegs: ItineraryTransportLeg[] = [];

  for (const group of dayGroups) {
    for (const entry of group.entries) {
      const key = resourceKey(entry.resourceType, entry.resourceId);
      if (seenResources.has(key)) continue;
      seenResources.add(key);
      const display = displayByResourceKey[key];
      if (!display) continue;

      if (display.resourceType === 'transport' && display.coords.length >= 2) {
        transportLegs.push({
          resourceId: display.resourceId,
          from: display.coords[0]!,
          to: display.coords[1]!,
        });
      }

      for (const point of display.coords) {
        const keyCoord = coordKey(point.coordinates);
        if (seenCoords.has(keyCoord)) continue;
        seenCoords.add(keyCoord);
        points.push(point);
      }
    }
  }

  return { points, transportLegs };
}

/** Points only — convenience for callers that do not need legs. */
export function collectMapPoints(
  dayGroups: ItineraryDayGroup[],
  displayByResourceKey: Record<string, ItineraryResourceDisplay>
): ItineraryMapPoint[] {
  return collectMapData(dayGroups, displayByResourceKey).points;
}
