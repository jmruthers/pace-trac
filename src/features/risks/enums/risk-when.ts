/** DB enum `risk_when`. */
export const RISK_WHEN_VALUES = ['Prior', 'During'] as const;

export type RiskWhen = (typeof RISK_WHEN_VALUES)[number];

export const RISK_WHEN_LABELS: Record<RiskWhen, string> = {
  Prior: 'Prior',
  During: 'During',
};

export function isRiskWhen(value: unknown): value is RiskWhen {
  return typeof value === 'string' && (RISK_WHEN_VALUES as readonly string[]).includes(value);
}
