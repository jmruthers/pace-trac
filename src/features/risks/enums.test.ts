import { describe, it, expect } from 'vitest';
import { isRiskConsequence, RISK_CONSEQUENCE_VALUES } from '@/features/risks/enums/risk-consequence';
import { isRiskLikelihood, RISK_LIKELIHOOD_VALUES } from '@/features/risks/enums/risk-likelihood';
import { isRiskStatus, RISK_STATUS_VALUES } from '@/features/risks/enums/risk-status';
import { isRiskType, RISK_TYPE_VALUES } from '@/features/risks/enums/risk-type';
import { isRiskWhen, RISK_WHEN_VALUES } from '@/features/risks/enums/risk-when';

describe('risk enums', () => {
  it('guards accept dev-db values', () => {
    expect(isRiskType('Transport')).toBe(true);
    expect(isRiskLikelihood('Likely')).toBe(true);
    expect(isRiskConsequence('Major')).toBe(true);
    expect(isRiskWhen('During')).toBe(true);
    expect(isRiskStatus('In progress')).toBe(true);
  });

  it('guards reject invalid values', () => {
    expect(isRiskType('Invalid')).toBe(false);
    expect(isRiskLikelihood('High')).toBe(false);
    expect(isRiskConsequence('Critical')).toBe(false);
  });

  it('enum arrays match expected lengths', () => {
    expect(RISK_TYPE_VALUES).toHaveLength(6);
    expect(RISK_LIKELIHOOD_VALUES).toHaveLength(5);
    expect(RISK_CONSEQUENCE_VALUES).toHaveLength(5);
    expect(RISK_WHEN_VALUES).toHaveLength(2);
    expect(RISK_STATUS_VALUES).toHaveLength(3);
  });
});
