import type { PlanningPlaceValue } from '@/features/planning/types';
import { parseCoordsFromRow } from '@/features/planning/location-snapshot';
import type { PlanningSupabaseClient } from '@/features/planning/supabase-helpers';

export async function readLocationCache(
  secureClient: PlanningSupabaseClient,
  placeId: string
): Promise<PlanningPlaceValue | null> {
  const { data, error } = await secureClient
    .from('trac_location_cache')
    .select('place_id, display_name, short_address, coordinates, timezoneid, description')
    .eq('place_id', placeId)
    .maybeSingle();

  if (error != null || data == null) return null;

  const coords = parseCoordsFromRow(data.coordinates);
  return {
    placeId: String(data.place_id ?? placeId),
    displayName: String(data.display_name ?? data.description ?? ''),
    shortAddress: typeof data.short_address === 'string' ? data.short_address : undefined,
    coordinates: coords ?? undefined,
    timezone: typeof data.timezoneid === 'string' ? data.timezoneid : undefined,
  };
}

/**
 * Best-effort cache write. Authenticated clients cannot INSERT per RLS (service_role only);
 * failures are non-blocking — row snapshots remain authoritative (DEC-083).
 */
export async function writeLocationCacheBestEffort(
  secureClient: PlanningSupabaseClient,
  place: PlanningPlaceValue
): Promise<{ ok: boolean; message?: string }> {
  try {
    const row = {
      place_id: place.placeId,
      description: place.displayName,
      display_name: place.displayName,
      short_address: place.shortAddress ?? null,
      coordinates: place.coordinates ?? null,
      timezoneid: place.timezone ?? null,
      last_updated: new Date().toISOString(),
    };
    const { error } = await secureClient.from('trac_location_cache').upsert(row, {
      onConflict: 'place_id',
    });
    if (error != null) {
      return { ok: false, message: String((error as { message?: string }).message ?? error) };
    }
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      message: cause instanceof Error ? cause.message : 'Location cache write failed',
    };
  }
}
