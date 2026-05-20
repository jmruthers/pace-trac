import type { QueryClient } from '@tanstack/react-query';

/** SLICE-06 list cache; SLICE-09 risk contact pickers should use the same key. */
export const tracContactsQueryKey = (eventId: string) => ['trac-contacts', eventId] as const;

/** Placeholder for SLICE-09 risk register reads. */
export const tracRisksQueryKey = (eventId: string) => ['trac-risks', eventId] as const;

export function invalidateContactsAndRiskPickers(
  queryClient: QueryClient,
  eventId: string
): void {
  void queryClient.invalidateQueries({ queryKey: tracContactsQueryKey(eventId) });
  void queryClient.invalidateQueries({ queryKey: tracRisksQueryKey(eventId) });
}
