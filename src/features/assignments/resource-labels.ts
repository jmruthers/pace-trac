import type {
  ActivityRow,
  AccommodationRow,
  LogisticsResourceKind,
  TransportRow,
} from '@/features/planning/types';
import type { ResourceSummary } from '@/features/assignments/types';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function transportSummaryLabel(row: TransportRow): string {
  const number = row.transport_number ? ` — ${row.transport_number}` : '';
  return `${row.mode}${number} (${formatWhen(row.departure_time)})`;
}

export function accommodationSummaryLabel(row: AccommodationRow): string {
  return `${row.name} (${formatWhen(row.check_in_time)})`;
}

export function activitySummaryLabel(row: ActivityRow): string {
  return `${row.name} (${formatWhen(row.start_time)})`;
}

export function toResourceSummaries(
  kind: LogisticsResourceKind,
  transport: TransportRow[],
  accommodation: AccommodationRow[],
  activities: ActivityRow[]
): ResourceSummary[] {
  if (kind === 'transport') {
    return transport.map((row) => ({
      id: row.id,
      kind,
      label: transportSummaryLabel(row),
      capacity: row.capacity,
    }));
  }
  if (kind === 'accommodation') {
    return accommodation.map((row) => ({
      id: row.id,
      kind,
      label: accommodationSummaryLabel(row),
      capacity: row.capacity,
    }));
  }
  return activities.map((row) => ({
    id: row.id,
    kind,
    label: activitySummaryLabel(row),
    capacity: row.capacity,
  }));
}

export function isLogisticsResourceKind(value: string | null): value is LogisticsResourceKind {
  return value === 'transport' || value === 'accommodation' || value === 'activity';
}
