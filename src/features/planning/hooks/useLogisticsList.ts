import { useQuery } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { planningQueryKeys } from '@/features/planning/query-keys';
import { usePlanningScope } from '@/features/planning/hooks/usePlanningScope';
import { asPlanningClient } from '@/features/planning/supabase-helpers';
import {
  LOGISTICS_TABLE_BY_KIND,
  type ActivityRow,
  type AccommodationRow,
  type LogisticsResourceKind,
  type TransportRow,
} from '@/features/planning/types';
import { parseCoordsFromRow } from '@/features/planning/location-snapshot';

function normalizeTransportRow(row: Record<string, unknown>): TransportRow {
  return {
    ...(row as unknown as TransportRow),
    departure_coords: parseCoordsFromRow(row.departure_coords) ?? null,
    arrival_coords: parseCoordsFromRow(row.arrival_coords) ?? null,
  };
}

function normalizeAccommodationRow(row: Record<string, unknown>): AccommodationRow {
  return {
    ...(row as unknown as AccommodationRow),
    location_coords: parseCoordsFromRow(row.location_coords) ?? null,
  };
}

function normalizeActivityRow(row: Record<string, unknown>): ActivityRow {
  return {
    ...(row as unknown as ActivityRow),
    start_location_coords: parseCoordsFromRow(row.start_location_coords) ?? null,
    finish_location_coords: parseCoordsFromRow(row.finish_location_coords) ?? null,
  };
}

export function useTransportList() {
  return useLogisticsList<TransportRow>('transport', normalizeTransportRow, 'departure_time');
}

export function useAccommodationList() {
  return useLogisticsList<AccommodationRow>('accommodation', normalizeAccommodationRow, 'check_in_time');
}

export function useActivityList() {
  return useLogisticsList<ActivityRow>('activity', normalizeActivityRow, 'start_time');
}

function useLogisticsList<T>(
  kind: LogisticsResourceKind,
  normalize: (row: Record<string, unknown>) => T,
  orderColumn: string
) {
  const secureSupabase = asPlanningClient(useSecureSupabase());
  const { eventId, isReady } = usePlanningScope();
  const table = LOGISTICS_TABLE_BY_KIND[kind];

  const query = useQuery({
    queryKey: planningQueryKeys.resource(kind, eventId ?? ''),
    enabled: Boolean(secureSupabase && isReady && eventId),
    queryFn: async (): Promise<T[]> => {
      if (!secureSupabase || !eventId) return [];
      const { data, error } = await secureSupabase
        .from(table)
        .select('*')
        .eq('event_id', eventId)
        .order(orderColumn, { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => normalize(row));
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
