import type { CostLogisticsLine } from '@/features/costs/types';
import type { LogisticsResourceKind } from '@/features/planning/types';

function pickLabel(row: Record<string, unknown>, kind: LogisticsResourceKind): string {
  if (kind === 'transport') {
    const departure = typeof row.departure_display_name === 'string' ? row.departure_display_name : '';
    const arrival = typeof row.arrival_display_name === 'string' ? row.arrival_display_name : '';
    const combined = [departure, arrival].filter(Boolean).join(' → ');
    return combined !== '' ? combined : 'Transport';
  }
  if (typeof row.name === 'string' && row.name.trim() !== '') {
    return row.name.trim();
  }
  if (kind === 'accommodation') return 'Accommodation';
  return 'Activity';
}

export function toCostLogisticsLine(
  row: Record<string, unknown>,
  kind: LogisticsResourceKind
): CostLogisticsLine {
  return {
    resourceType: kind,
    resourceId: String(row.id),
    currency: typeof row.currency === 'string' ? row.currency : null,
    individual_cost: typeof row.individual_cost === 'number' ? row.individual_cost : null,
    group_cost: typeof row.group_cost === 'number' ? row.group_cost : null,
    label: pickLabel(row, kind),
  };
}
