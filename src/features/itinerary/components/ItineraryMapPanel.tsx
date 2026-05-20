import { useEffect, useRef } from 'react';
import { Alert } from '@solvera/pace-core/components';
import { useGoogleMapsPlanning } from '@/features/planning/context/GoogleMapsPlanningContext';
import type { ItineraryMapData } from '@/features/itinerary/collect-map-points';

interface ItineraryMapPanelProps {
  mapData: ItineraryMapData;
}

type MapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: { mapTypeControl: boolean; streetViewControl: boolean; fullscreenControl: boolean }
    ) => { fitBounds: (bounds: unknown) => void };
    LatLngBounds: new () => { extend: (coords: { lat: number; lng: number }) => void };
    Marker: new (options: {
      map: unknown;
      position: { lat: number; lng: number };
      title: string;
    }) => unknown;
    Polyline: new (options: {
      map: unknown;
      path: { lat: number; lng: number }[];
    }) => unknown;
  };
};

function getMapsApi(): MapsApi | null {
  const candidate = (globalThis as { google?: MapsApi }).google;
  return candidate?.maps != null ? candidate : null;
}

function clearMapOverlays(markers: unknown[], polylines: unknown[]) {
  for (const marker of markers) {
    if (
      marker != null &&
      typeof marker === 'object' &&
      'setMap' in marker &&
      typeof (marker as { setMap: (value: null) => void }).setMap === 'function'
    ) {
      (marker as { setMap: (value: null) => void }).setMap(null);
    }
  }
  for (const line of polylines) {
    if (
      line != null &&
      typeof line === 'object' &&
      'setMap' in line &&
      typeof (line as { setMap: (value: null) => void }).setMap === 'function'
    ) {
      (line as { setMap: (value: null) => void }).setMap(null);
    }
  }
}

export function ItineraryMapPanel({ mapData }: ItineraryMapPanelProps) {
  const { isLoaded, isError } = useGoogleMapsPlanning();
  const containerRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const polylinesRef = useRef<unknown[]>([]);

  const { points, transportLegs } = mapData;
  const hasMapContent = points.length > 0 || transportLegs.length > 0;

  useEffect(() => {
    if (!isLoaded || !hasMapContent || containerRef.current == null) return;
    const mapsApi = getMapsApi();
    if (mapsApi == null) return;

    clearMapOverlays(markersRef.current, polylinesRef.current);
    markersRef.current = [];
    polylinesRef.current = [];

    const bounds = new mapsApi.maps.LatLngBounds();
    for (const point of points) {
      bounds.extend(point.coordinates);
    }
    for (const leg of transportLegs) {
      bounds.extend(leg.from.coordinates);
      bounds.extend(leg.to.coordinates);
    }

    if (mapRef.current == null) {
      mapRef.current = new mapsApi.maps.Map(containerRef.current, {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    const map = mapRef.current;
    (map as { fitBounds: (b: unknown) => void }).fitBounds(bounds);

    for (const point of points) {
      markersRef.current.push(
        new mapsApi.maps.Marker({
          map,
          position: point.coordinates,
          title: point.label,
        })
      );
    }

    for (const leg of transportLegs) {
      polylinesRef.current.push(
        new mapsApi.maps.Polyline({
          map,
          path: [leg.from.coordinates, leg.to.coordinates],
        })
      );
    }
  }, [isLoaded, hasMapContent, points, transportLegs]);

  if (isError) {
    return (
      <section aria-label="Itinerary map">
        <h2>Map</h2>
        <Alert>
          <p>Map could not be loaded. Use the day-by-day list for schedule details.</p>
        </Alert>
      </section>
    );
  }

  if (!hasMapContent) {
    return (
      <section aria-label="Itinerary map">
        <h2>Map</h2>
        <p>No location coordinates are saved on the visible logistics rows yet.</p>
      </section>
    );
  }

  return (
    <section aria-label="Itinerary map">
      <h2>Map</h2>
      <p>Locations use coordinates saved on logistics rows at planning time.</p>
      {!isLoaded ? <p>Loading map…</p> : null}
      <article ref={containerRef} className="min-h-64 w-full rounded-md border border-sec-200" />
    </section>
  );
}
