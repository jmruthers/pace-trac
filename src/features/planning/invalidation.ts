import type { QueryClient } from '@tanstack/react-query';
import {
  planningQueryKeys,
  TRAC_COSTS_QUERY_PREFIX,
  TRAC_DASHBOARD_QUERY_PREFIX,
  TRAC_ITINERARY_QUERY_PREFIX,
  TRAC_MASTERPLAN_QUERY_PREFIX,
} from '@/features/planning/query-keys';

/** Invalidate planning lists and downstream composite reads after logistics mutations. */
export async function invalidatePlanningAndDependents(
  queryClient: QueryClient,
  eventId: string
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: planningQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: planningQueryKeys.resource('transport', eventId) }),
    queryClient.invalidateQueries({ queryKey: planningQueryKeys.resource('accommodation', eventId) }),
    queryClient.invalidateQueries({ queryKey: planningQueryKeys.resource('activity', eventId) }),
    queryClient.invalidateQueries({ queryKey: TRAC_ITINERARY_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: TRAC_COSTS_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: TRAC_DASHBOARD_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: TRAC_MASTERPLAN_QUERY_PREFIX }),
  ]);
}
