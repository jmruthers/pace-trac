import { useQuery } from '@tanstack/react-query';
import { useUnifiedAuthContext } from '@solvera/pace-core';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { err, isErr, ok, type ApiResult } from '@solvera/pace-core/types';
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
): Promise<ApiResult<ViewerApplication | null>> {
  const { data, error } = await secureSupabase
    .from('base_application')
    .select('id, event_id, status')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error != null) {
    return err({
      code: 'VIEWER_APPLICATION_LIST_FAILED',
      message: error.message,
    });
  }

  const rows = (data ?? []).map(normalizeViewerApplication);
  for (const row of rows) {
    const { data: isApplicant, error: rpcError } = await secureSupabase.rpc(
      'base_application_is_applicant',
      {
        p_application_id: row.id,
        p_user_id: userId,
      }
    );
    if (rpcError != null) {
      return err({
        code: 'VIEWER_APPLICATION_APPLICANT_CHECK_FAILED',
        message: rpcError.message,
      });
    }
    if (isApplicant === true) return ok(row);
  }

  return ok(null);
}

/** Event-scoped application for the signed-in viewer when they are the applicant (RLS + RPC). */
export function useViewerApplication() {
  const secureSupabase = asItineraryClient(useSecureSupabase());
  const { user } = useUnifiedAuthContext();
  const { eventId, isReady } = useItineraryScope();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: itineraryQueryKeys.viewerApplication(eventId ?? '', userId ?? ''),
    enabled: Boolean(secureSupabase && isReady && eventId && userId),
    queryFn: async (): Promise<ViewerApplication | null> => {
      if (!secureSupabase || !eventId || !userId) return null;
      const result = await resolveApplicantApplication(secureSupabase, eventId, userId);
      if (isErr(result)) {
        throw new Error(result.error.message);
      }
      return result.data;
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
