import { useMemo } from 'react';
import { usePageCan } from '@solvera/pace-core/rbac';
import { useViewerApplication } from '@/features/itinerary/hooks/useViewerApplication';
import type { ItineraryAudienceMode } from '@/features/itinerary/types';

export function useItineraryAudience() {
  const { can: canReadPlanning, isLoading: planningPermissionLoading } = usePageCan(
    'planning',
    'read'
  );
  const {
    application,
    isLoading: applicationLoading,
    isError: applicationError,
    error: applicationQueryError,
  } = useViewerApplication();

  const mode: ItineraryAudienceMode = useMemo(() => {
    if (canReadPlanning && application != null) return 'dual';
    if (canReadPlanning) return 'planner';
    if (application != null) return 'participant';
    return 'day_visitor';
  }, [canReadPlanning, application]);

  return {
    mode,
    canReadPlanning,
    participantApplicationId: application?.id ?? null,
    isLoading: planningPermissionLoading || applicationLoading,
    isError: applicationError,
    error: applicationQueryError,
  };
}
