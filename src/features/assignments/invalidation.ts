import type { QueryClient } from '@tanstack/react-query';
import { assignmentsQueryKeys } from '@/features/assignments/query-keys';
import {
  TRAC_COSTS_QUERY_PREFIX,
  TRAC_DASHBOARD_QUERY_PREFIX,
  TRAC_ITINERARY_QUERY_PREFIX,
  TRAC_MASTERPLAN_QUERY_PREFIX,
} from '@/features/planning/query-keys';

/** Invalidate assignment reads and downstream composite queries (TR04 API contract). */
export async function invalidateAssignmentsAndDependents(
  queryClient: QueryClient,
  eventId: string
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: assignmentsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: assignmentsQueryKeys.byEvent(eventId) }),
    queryClient.invalidateQueries({ queryKey: assignmentsQueryKeys.approvedApplications(eventId) }),
    queryClient.invalidateQueries({ queryKey: TRAC_ITINERARY_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: TRAC_COSTS_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: TRAC_DASHBOARD_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: TRAC_MASTERPLAN_QUERY_PREFIX }),
  ]);
}
