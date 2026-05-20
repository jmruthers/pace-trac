import type { LogisticsResourceKind } from '@/features/planning/types';

/** DB enum `trac_resource_type` — aligns with logistics resource kinds. */
export type TracResourceType = LogisticsResourceKind;

/** Row shape for `public.trac_itinerary_assignment` (dev-db / DEC-058). */
export interface AssignmentRow {
  id: string;
  application_id: string;
  resource_type: TracResourceType;
  resource_id: string;
  event_id: string;
  organisation_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/** Writable assignment fields (excludes audit and scope ids). */
export interface AssignmentWriteInput {
  application_id: string;
  resource_type: TracResourceType;
  resource_id: string;
  notes?: string | null;
}

/** Approved `base_application` row for participant picker (dev-db). */
export interface ApprovedApplication {
  id: string;
  event_id: string;
  status: string;
  first_name: string | null;
  surname: string | null;
}

export interface AssignmentWithParticipant extends AssignmentRow {
  participantLabel: string;
}

export interface ResourceSummary {
  id: string;
  kind: LogisticsResourceKind;
  label: string;
  capacity: number | null;
}
