import type { LogisticsResourceKind, LogisticsTableName } from '@/features/planning/types';
import { TRAC_COSTS_QUERY_PREFIX } from '@/features/costs/cost-query-keys';

export { TRAC_COSTS_QUERY_PREFIX };
export const TRAC_ITINERARY_QUERY_PREFIX = ['trac-itinerary'] as const;
export const TRAC_DASHBOARD_QUERY_PREFIX = ['trac-dashboard'] as const;
export const TRAC_MASTERPLAN_QUERY_PREFIX = ['trac-masterplan'] as const;

export const planningQueryKeys = {
  all: ['trac-planning'] as const,
  resource: (kind: LogisticsResourceKind, eventId: string) =>
    ['trac-planning', kind, eventId] as const,
  attachments: (tableName: LogisticsTableName, recordId: string) =>
    ['trac-planning-attachments', tableName, recordId] as const,
};
