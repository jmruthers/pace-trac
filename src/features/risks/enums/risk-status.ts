/** DB enum `risk_status`. */
export const RISK_STATUS_VALUES = ['Planned', 'In progress', 'Complete'] as const;

export type RiskStatus = (typeof RISK_STATUS_VALUES)[number];

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  Planned: 'Planned',
  'In progress': 'In progress',
  Complete: 'Complete',
};

export function isRiskStatus(value: unknown): value is RiskStatus {
  return typeof value === 'string' && (RISK_STATUS_VALUES as readonly string[]).includes(value);
}
