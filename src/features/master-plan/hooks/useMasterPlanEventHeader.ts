import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEvents } from '@solvera/pace-core/hooks';
import type { FileReference } from '@solvera/pace-core/types';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { TRAC_MASTERPLAN_QUERY_PREFIX } from '@/features/planning/query-keys';
import { usePlanningScope } from '@/features/planning/hooks/usePlanningScope';
import { formatMasterPlanEventDateRange } from '@/features/master-plan/format-event-date-range';
import { asMasterPlanReadClient } from '@/features/master-plan/supabase-master-plan-read-client';

const CORE_EVENTS_TABLE = 'core_events';
const FILE_REFERENCES_TABLE = 'core_file_references';

export interface MasterPlanEventHeader {
  eventName: string;
  dateRangeLabel: string;
  logoFileReference: FileReference | null;
}

function readFirstString(
  record: Record<string, unknown> | null | undefined,
  keys: readonly string[]
): string | null {
  if (record == null) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return null;
}

function readFirstNumber(
  record: Record<string, unknown> | null | undefined,
  keys: readonly string[]
): number | null {
  if (record == null) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function deriveDateRangeFromRecord(record: Record<string, unknown>): {
  startDate: string | null;
  endDate: string | null;
} {
  const startDate = readFirstString(record, [
    'event_start_date',
    'event_date',
    'start_date',
    'date',
  ]);
  const directEndDate = readFirstString(record, ['event_end_date', 'end_date']);
  const eventDays = readFirstNumber(record, ['event_days', 'days']);

  if (startDate == null) {
    return { startDate: null, endDate: directEndDate };
  }
  if (directEndDate != null) {
    return { startDate, endDate: directEndDate };
  }
  if (eventDays == null || eventDays < 0) {
    return { startDate, endDate: startDate };
  }
  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) {
    return { startDate, endDate: startDate };
  }
  const end = new Date(parsed);
  end.setDate(end.getDate() + eventDays);
  return { startDate, endDate: end.toISOString() };
}

function mapFileReferenceRow(row: Record<string, unknown>): FileReference {
  return row as unknown as FileReference;
}

export function useMasterPlanEventHeader() {
  const { selectedEvent, isLoading: eventsLoading } = useEvents();
  const readClient = asMasterPlanReadClient(useSecureSupabase());
  const { eventId, isReady } = usePlanningScope();

  const selectedRecord = selectedEvent as Record<string, unknown> | null;

  const query = useQuery({
    queryKey: [...TRAC_MASTERPLAN_QUERY_PREFIX, 'header', eventId ?? 'none'],
    enabled: Boolean(readClient && isReady && eventId),
    queryFn: async (): Promise<MasterPlanEventHeader> => {
      if (readClient == null || eventId == null) {
        throw new Error('Event context not available');
      }

      const { data, error } = await readClient
        .from(CORE_EVENTS_TABLE)
        .select(
          'event_id, event_name, logo_id, event_start_date, event_end_date, event_date, start_date, end_date, event_days'
        )
        .eq('event_id', eventId)
        .maybeSingle();

      if (error != null) {
        throw new Error(error.message);
      }

      const dbRecord = (data ?? {}) as Record<string, unknown>;
      const merged: Record<string, unknown> = {
        ...(selectedRecord ?? {}),
        ...dbRecord,
      };

      const eventName =
        readFirstString(merged, ['event_name', 'name']) ??
        readFirstString(selectedRecord, ['event_name', 'name']) ??
        'Event';

      const dateRange = deriveDateRangeFromRecord(merged);
      const dateRangeLabel = formatMasterPlanEventDateRange(dateRange);

      const logoId = readFirstString(merged, ['logo_id']);
      let logoFileReference: FileReference | null = null;

      if (logoId != null) {
        const fileResult = await readClient
          .from(FILE_REFERENCES_TABLE)
          .select('*')
          .eq('id', logoId)
          .maybeSingle();
        if (fileResult.error != null) {
          throw new Error(fileResult.error.message);
        }
        if (fileResult.data != null) {
          logoFileReference = mapFileReferenceRow(fileResult.data as Record<string, unknown>);
        }
      }

      return {
        eventName,
        dateRangeLabel,
        logoFileReference,
      };
    },
    staleTime: 60_000,
    retry: 1,
  });

  const errorMessage = useMemo(() => {
    if (query.error instanceof Error) return query.error.message;
    if (query.error != null) return String(query.error);
    return null;
  }, [query.error]);

  return {
    header: query.data ?? null,
    isLoading: eventsLoading || query.isLoading,
    isError: query.isError,
    error: errorMessage,
    refetch: query.refetch,
  };
}
