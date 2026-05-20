import type {
  DerivedItineraryDayEntry,
  ItineraryDayGroup,
  ItineraryVisibleDateRange,
} from '@solvera/pace-core/itinerary';
import type { Coordinates, LogisticsResourceKind } from '@/features/planning/types';

export type ItineraryAudienceMode = 'planner' | 'participant' | 'day_visitor' | 'dual';

export interface ViewerApplication {
  id: string;
  event_id: string;
  status: string;
}

export interface ItineraryTransportLeg {
  resourceId: string;
  from: ItineraryMapPoint;
  to: ItineraryMapPoint;
}

export interface ItineraryResourceDisplay {
  resourceType: LogisticsResourceKind;
  resourceId: string;
  title: string;
  subtitle: string | null;
  coords: ItineraryMapPoint[];
  /** Set for accommodation rows — used for same-local-day check-in/out copy. */
  checkInTime?: string;
  checkOutTime?: string;
}

export interface ItineraryMapPoint {
  label: string;
  coordinates: Coordinates;
}

export interface ItineraryBuildIssue {
  resourceType: LogisticsResourceKind;
  resourceId: string;
  message: string;
}

export interface ItineraryModel {
  dayGroups: ItineraryDayGroup[];
  visibleDateRange: ItineraryVisibleDateRange | null;
  displayByResourceKey: Record<string, ItineraryResourceDisplay>;
  skippedResources: ItineraryBuildIssue[];
}

export interface ItineraryEntryView extends DerivedItineraryDayEntry {
  display: ItineraryResourceDisplay;
}
