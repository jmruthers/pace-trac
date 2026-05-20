/** DB enum `risk_type`. */
export const RISK_TYPE_VALUES = [
  'Transport',
  'Accommodation',
  'Activity',
  'Financial',
  'Medical/Welfare',
  'Operational',
] as const;

export type RiskType = (typeof RISK_TYPE_VALUES)[number];

export const RISK_TYPE_LABELS: Record<RiskType, string> = {
  Transport: 'Transport',
  Accommodation: 'Accommodation',
  Activity: 'Activity',
  Financial: 'Financial',
  'Medical/Welfare': 'Medical/Welfare',
  Operational: 'Operational',
};

export function isRiskType(value: unknown): value is RiskType {
  return typeof value === 'string' && (RISK_TYPE_VALUES as readonly string[]).includes(value);
}
