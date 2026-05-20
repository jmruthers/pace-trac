import { useQuery } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { assignmentsQueryKeys } from '@/features/assignments/query-keys';
import { useAssignmentsScope } from '@/features/assignments/hooks/useAssignmentsScope';
import { asAssignmentsClient } from '@/features/assignments/supabase-helpers';
import type { ApprovedApplication } from '@/features/assignments/types';

const APPROVED_STATUS = 'approved';

function normalizeApplication(row: Record<string, unknown>): ApprovedApplication {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    status: String(row.status),
    first_name: typeof row.first_name === 'string' ? row.first_name : null,
    surname: typeof row.surname === 'string' ? row.surname : null,
  };
}

export function useApprovedApplications() {
  const secureSupabase = asAssignmentsClient(useSecureSupabase());
  const { eventId, isReady } = useAssignmentsScope();

  const query = useQuery({
    queryKey: assignmentsQueryKeys.approvedApplications(eventId ?? ''),
    enabled: Boolean(secureSupabase && isReady && eventId),
    queryFn: async (): Promise<ApprovedApplication[]> => {
      if (!secureSupabase || !eventId) return [];
      const { data, error } = await secureSupabase
        .from('base_application')
        .select('id, event_id, status, first_name, surname')
        .eq('event_id', eventId)
        .eq('status', APPROVED_STATUS)
        .order('surname', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map(normalizeApplication);
    },
    staleTime: 30_000,
  });

  return {
    applications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
