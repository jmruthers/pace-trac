import type { LogisticsResourceKind } from '@/features/planning/types';

export const assignmentsQueryKeys = {
  all: ['trac-assignments'] as const,
  byEvent: (eventId: string) => ['trac-assignments', eventId] as const,
  byResource: (eventId: string, kind: LogisticsResourceKind, resourceId: string) =>
    ['trac-assignments', eventId, kind, resourceId] as const,
  approvedApplications: (eventId: string) => ['trac-assignments-approved-apps', eventId] as const,
};
