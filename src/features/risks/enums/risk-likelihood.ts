/** DB enum `risk_likelihood`. */
export const RISK_LIKELIHOOD_VALUES = [
  'Rare',
  'Unlikely',
  'Possible',
  'Likely',
  'Almost certain',
] as const;

export type RiskLikelihood = (typeof RISK_LIKELIHOOD_VALUES)[number];

export const RISK_LIKELIHOOD_LABELS: Record<RiskLikelihood, string> = {
  Rare: 'Rare',
  Unlikely: 'Unlikely',
  Possible: 'Possible',
  Likely: 'Likely',
  'Almost certain': 'Almost certain',
};

export function isRiskLikelihood(value: unknown): value is RiskLikelihood {
  return typeof value === 'string' && (RISK_LIKELIHOOD_VALUES as readonly string[]).includes(value);
}
