import { useMemo } from 'react';
import type { ItineraryScope } from '@solvera/pace-core/itinerary';
import { buildItineraryModel } from '@/features/itinerary/build-itinerary-model';
import { useItineraryAudience } from '@/features/itinerary/hooks/useItineraryAudience';
import { useEventAssignments } from '@/features/itinerary/hooks/useEventAssignments';
import {
  buildDisplayByResourceKey,
  mapAssignmentsToItineraryInput,
  mapLogisticsToItineraryResources,
} from '@/features/itinerary/map-logistics-to-itinerary-input';
import type { ItineraryModel } from '@/features/itinerary/types';
import {
  useAccommodationList,
  useActivityList,
  useTransportList,
} from '@/features/planning/hooks/useLogisticsList';

export type ItineraryViewTab = 'event' | 'personal';

function scopeForTab(
  tab: ItineraryViewTab,
  participantApplicationId: string | null
): ItineraryScope | undefined {
  if (tab === 'personal' && participantApplicationId) {
    return { mode: 'participant', participantApplicationId };
  }
  return { mode: 'all' };
}

export function useItineraryViewModel(activeTab: ItineraryViewTab) {
  const transport = useTransportList();
  const accommodation = useAccommodationList();
  const activity = useActivityList();
  const { assignments, isLoading: assignmentsLoading, isError: assignmentsError, error: assignmentsErrorObj } =
    useEventAssignments();
  const audience = useItineraryAudience();

  const isLoading =
    transport.isLoading ||
    accommodation.isLoading ||
    activity.isLoading ||
    assignmentsLoading ||
    audience.isLoading;

  const isError =
    transport.isError ||
    accommodation.isError ||
    activity.isError ||
    assignmentsError ||
    audience.isError;

  const error =
    transport.error ??
    accommodation.error ??
    activity.error ??
    assignmentsErrorObj ??
    audience.error ??
    null;

  const resources = useMemo(
    () =>
      mapLogisticsToItineraryResources({
        transport: transport.items,
        accommodation: accommodation.items,
        activity: activity.items,
      }),
    [transport.items, accommodation.items, activity.items]
  );

  const displayByResourceKey = useMemo(
    () =>
      buildDisplayByResourceKey({
        transport: transport.items,
        accommodation: accommodation.items,
        activity: activity.items,
      }),
    [transport.items, accommodation.items, activity.items]
  );

  const assignmentInputs = useMemo(
    () => mapAssignmentsToItineraryInput(assignments),
    [assignments]
  );

  const model: ItineraryModel | null = useMemo(() => {
    if (audience.mode === 'day_visitor') return null;

    const tab: ItineraryViewTab =
      audience.mode === 'participant' ? 'personal' : activeTab;

    if (audience.mode === 'participant' && !audience.participantApplicationId) {
      return null;
    }

    const scope = scopeForTab(tab, audience.participantApplicationId);

    return buildItineraryModel({
      resources,
      assignments: assignmentInputs,
      scope,
      eventDefaultTimezone: null,
      displayByResourceKey,
    });
  }, [
    activeTab,
    assignmentInputs,
    audience.mode,
    audience.participantApplicationId,
    displayByResourceKey,
    resources,
  ]);

  return {
    audience,
    model,
    isLoading,
    isError,
    error,
    transportItems: transport.items,
    accommodationItems: accommodation.items,
    activityItems: activity.items,
  };
}
