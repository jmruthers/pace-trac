import type { Risk } from '@/features/risks/types';

export interface RiskImpactDisplay {
  before: string;
  after: string;
}

/** Formats read-only generated impact scores for display (DEC-081). */
export function formatRiskImpact(row: Pick<Risk, 'impact_before' | 'impact_after'>): RiskImpactDisplay {
  return {
    before: formatImpactValue(row.impact_before),
    after: formatImpactValue(row.impact_after),
  };
}

function formatImpactValue(value: number | null | undefined): string {
  if (value == null) {
    return '—';
  }
  return String(value);
}
