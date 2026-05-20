import type { LogisticsResourceKind } from '@/features/planning/types';

const RESOURCE_TYPE_LABELS: Record<LogisticsResourceKind, string> = {
  transport: 'Transport',
  accommodation: 'Accommodation',
  activity: 'Activity',
};

export function formatResourceTypeLabel(kind: LogisticsResourceKind): string {
  return RESOURCE_TYPE_LABELS[kind];
}
