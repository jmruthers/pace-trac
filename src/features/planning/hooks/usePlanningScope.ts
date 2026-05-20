import { useMemo } from 'react';
import { useOptionalEvents } from '@solvera/pace-core/hooks';
import { useResolvedScope } from '@solvera/pace-core/rbac';

export function usePlanningScope() {
  const { selectedEvent, isLoading: eventsLoading } = useOptionalEvents();
  const resolved = useResolvedScope();

  const eventId = selectedEvent?.id ?? resolved.eventId ?? null;
  const organisationId = resolved.organisationId ?? null;
  const appId = resolved.appId ?? null;

  const isReady = useMemo(
    () => Boolean(eventId && organisationId && !eventsLoading && !resolved.isLoading),
    [eventId, organisationId, eventsLoading, resolved.isLoading]
  );

  return {
    eventId,
    organisationId,
    appId,
    isReady,
    isLoading: eventsLoading || resolved.isLoading,
  };
}
