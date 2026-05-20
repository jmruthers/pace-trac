import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { formatParticipantLabel } from '@/features/assignments/participant-label';
import { assignmentsQueryKeys } from '@/features/assignments/query-keys';
import { useApprovedApplications } from '@/features/assignments/hooks/useApprovedApplications';
import { useAssignmentsScope } from '@/features/assignments/hooks/useAssignmentsScope';
import { asAssignmentsClient } from '@/features/assignments/supabase-helpers';
import type { AssignmentRow, AssignmentWithParticipant, TracResourceType } from '@/features/assignments/types';

function normalizeAssignment(row: Record<string, unknown>): AssignmentRow {
  return {
    id: String(row.id),
    application_id: String(row.application_id),
    resource_type: row.resource_type as TracResourceType,
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

export function useAssignmentsForResource(
  resourceType: TracResourceType | null,
  resourceId: string | null
) {
  const secureSupabase = asAssignmentsClient(useSecureSupabase());
  const { eventId, isReady } = useAssignmentsScope();
  const { applications } = useApprovedApplications();

  const appLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of applications) {
      map.set(app.id, formatParticipantLabel(app));
    }
    return map;
  }, [applications]);

  const query = useQuery({
    queryKey: assignmentsQueryKeys.byResource(eventId ?? '', resourceType ?? 'activity', resourceId ?? ''),
    enabled: Boolean(secureSupabase && isReady && eventId && resourceType && resourceId),
    queryFn: async (): Promise<AssignmentRow[]> => {
      if (!secureSupabase || !eventId || !resourceType || !resourceId) return [];
      const { data, error } = await secureSupabase
        .from('trac_itinerary_assignment')
        .select('*')
        .eq('event_id', eventId)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(normalizeAssignment);
    },
  });

  const assignmentsWithParticipants: AssignmentWithParticipant[] = useMemo(
    () =>
      (query.data ?? []).map((row) => ({
        ...row,
        participantLabel: appLabelById.get(row.application_id) ?? `Application ${row.application_id.slice(0, 8)}`,
      })),
    [query.data, appLabelById]
  );

  return {
    assignments: assignmentsWithParticipants,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
