import type { TracStatus, TransportMode } from '@/features/planning/enums';

export type LogisticsResourceKind = 'transport' | 'accommodation' | 'activity';

export type LogisticsTableName =
  | 'trac_transport'
  | 'trac_accommodation'
  | 'trac_activity';

export const LOGISTICS_TABLE_BY_KIND: Record<LogisticsResourceKind, LogisticsTableName> = {
  transport: 'trac_transport',
  accommodation: 'trac_accommodation',
  activity: 'trac_activity',
};

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlanningPlaceValue {
  placeId: string;
  displayName: string;
  shortAddress?: string;
  coordinates?: Coordinates;
  timezone?: string;
}

export interface BaseLogisticsRow {
  id: string;
  event_id: string;
  organisation_id: string;
  status: TracStatus | null;
  notes: string | null;
  booking_reference: string | null;
  currency: string | null;
  individual_cost: number | null;
  group_cost: number | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TransportRow extends BaseLogisticsRow {
  mode: TransportMode;
  transport_number: string | null;
  departure_time: string;
  arrival_time: string;
  departure_place_id: string | null;
  departure_display_name: string | null;
  departure_short_address: string | null;
  departure_coords: Coordinates | null;
  departure_timezone: string | null;
  arrival_place_id: string | null;
  arrival_display_name: string | null;
  arrival_short_address: string | null;
  arrival_coords: Coordinates | null;
  arrival_timezone: string | null;
}

export interface AccommodationRow extends BaseLogisticsRow {
  name: string;
  check_in_time: string;
  check_out_time: string;
  location_place_id: string | null;
  location_display_name: string | null;
  location_short_address: string | null;
  location_coords: Coordinates | null;
  location_timezone: string | null;
}

export interface ActivityRow extends BaseLogisticsRow {
  name: string;
  start_time: string;
  finish_time: string;
  start_location_place_id: string | null;
  start_location_display_name: string | null;
  start_location_short_address: string | null;
  start_location_coords: Coordinates | null;
  start_location_timezone: string | null;
  finish_location_place_id: string | null;
  finish_location_display_name: string | null;
  finish_location_short_address: string | null;
  finish_location_coords: Coordinates | null;
  finish_location_timezone: string | null;
}

export interface PlanningAttachment {
  id: string;
  record_id: string;
  table_name: LogisticsTableName;
  file_path: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string | null;
}
