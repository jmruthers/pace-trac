import { useQuery } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { asAssignmentsClient } from '@/features/assignments/supabase-helpers';
import type { AssignmentRow } from '@/features/assignments/types';
import { itineraryQueryKeys } from '@/features/itinerary/query-keys';
import { useItineraryScope } from '@/features/itinerary/hooks/useItineraryScope';

function normalizeAssignment(row: Record<string, unknown>): AssignmentRow {
  return {
    id: String(row.id),
    application_id: String(row.application_id),
    resource_type: row.resource_type as AssignmentRow['resource_type'],
    resource_id: String(row.resource_id),
    event_id: String(row.event_id),
    organisation_id: String(row.organisation_id),
    notes: typeof row.notes === 'string' ? row.notes : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    created_by: typeof row.created_by === 'string' ? row.created_by : null,
    updated_by: typeof row.updated_by === 'string' ? row.updated_by : null,
  };
}

export function useEventAssignments() {
  const secureSupabase = asAssignmentsClient(useSecureSupabase());
  const { eventId, isReady } = useItineraryScope();

  const query = useQuery({
    queryKey: itineraryQueryKeys.assignments(eventId ?? ''),
    enabled: Boolean(secureSupabase && isReady && eventId),
    queryFn: async (): Promise<AssignmentRow[]> => {
      if (!secureSupabase || !eventId) return [];
      const { data, error } = await secureSupabase
        .from('trac_itinerary_assignment')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(normalizeAssignment);
    },
    staleTime: 30_000,
  });

  return {
    assignments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
