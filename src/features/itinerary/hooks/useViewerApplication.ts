import { useQuery } from '@tanstack/react-query';
import { useUnifiedAuthContext } from '@solvera/pace-core';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { itineraryQueryKeys } from '@/features/itinerary/query-keys';
import { useItineraryScope } from '@/features/itinerary/hooks/useItineraryScope';
import { asItineraryClient } from '@/features/itinerary/supabase-helpers';
import type { ViewerApplication } from '@/features/itinerary/types';

function normalizeViewerApplication(row: Record<string, unknown>): ViewerApplication {
  return {
    id: String(row.id),
    event_id: String(row.event_id),
    status: String(row.status),
  };
}

async function resolveApplicantApplication(
  secureSupabase: NonNullable<ReturnType<typeof asItineraryClient>>,
  eventId: string,
  userId: string
): Promise<ViewerApplication | null> {
  const { data, error } = await secureSupabase
    .from('base_application')
    .select('id, event_id, status')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map(normalizeViewerApplication);
  for (const row of rows) {
    const { data: isApplicant, error: rpcError } = await secureSupabase.rpc(
      // Supabase contract RPC (TR05 / Option A RLS); not a client-defined data_* name.
      // eslint-disable-next-line pace-core-compliance/rpc-naming-pattern -- backend function name
      'base_application_is_applicant',
      {
        p_application_id: row.id,
        p_user_id: userId,
      }
    );
    if (rpcError) throw new Error(rpcError.message);
    if (isApplicant === true) return row;
  }

  return null;
}

/** Event-scoped application for the signed-in viewer when they are the applicant (RLS + RPC). */
export function useViewerApplication() {
  const secureSupabase = asItineraryClient(useSecureSupabase());
  const { user } = useUnifiedAuthContext();
  const { eventId, isReady } = useItineraryScope();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: itineraryQueryKeys.viewerApplication(eventId ?? ''),
    enabled: Boolean(secureSupabase && isReady && eventId && userId),
    queryFn: async (): Promise<ViewerApplication | null> => {
      if (!secureSupabase || !eventId || !userId) return null;
      return resolveApplicantApplication(secureSupabase, eventId, userId);
    },
    staleTime: 30_000,
  });

  return {
    application: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
