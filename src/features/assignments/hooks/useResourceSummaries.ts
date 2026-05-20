import { useMemo } from 'react';
import { useAccommodationList, useActivityList, useTransportList } from '@/features/planning/hooks/useLogisticsList';
import type { LogisticsResourceKind } from '@/features/planning/types';
import { toResourceSummaries } from '@/features/assignments/resource-labels';
import type { ResourceSummary } from '@/features/assignments/types';

export function useResourceSummaries(kind: LogisticsResourceKind) {
  const transport = useTransportList();
  const accommodation = useAccommodationList();
  const activity = useActivityList();

  const isLoading = transport.isLoading || accommodation.isLoading || activity.isLoading;
  const isError = transport.isError || accommodation.isError || activity.isError;
  const error = transport.error ?? accommodation.error ?? activity.error;

  const summaries: ResourceSummary[] = useMemo(
    () =>
      toResourceSummaries(
        kind,
        transport.items,
        accommodation.items,
        activity.items
      ),
    [kind, transport.items, accommodation.items, activity.items]
  );

  const selectedSummary = (resourceId: string | null): ResourceSummary | undefined =>
    resourceId != null ? summaries.find((s) => s.id === resourceId) : undefined;

  return {
    summaries,
    selectedSummary,
    isLoading,
    isError,
    error,
  };
}
