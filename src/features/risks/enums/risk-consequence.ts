/** DB enum `risk_consequence`. */
export const RISK_CONSEQUENCE_VALUES = [
  'Insignificant',
  'Minor',
  'Significant',
  'Major',
  'Severe',
] as const;

export type RiskConsequence = (typeof RISK_CONSEQUENCE_VALUES)[number];

export const RISK_CONSEQUENCE_LABELS: Record<RiskConsequence, string> = {
  Insignificant: 'Insignificant',
  Minor: 'Minor',
  Significant: 'Significant',
  Major: 'Major',
  Severe: 'Severe',
};

export function isRiskConsequence(value: unknown): value is RiskConsequence {
  return typeof value === 'string' && (RISK_CONSEQUENCE_VALUES as readonly string[]).includes(value);
}
