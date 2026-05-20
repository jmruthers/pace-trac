import { describe, it, expect } from 'vitest';
import { parseRiskFormData, type RiskFormInput } from '@/features/risks/risk-schema';

describe('parseRiskFormData', () => {
  const validInput: RiskFormInput = {
    type: 'Operational',
    risk: 'Venue access delay',
    likelihood_before: 'Possible',
    consequence_before: 'Minor',
    when: 'Prior',
    status: 'Planned',
    likelihood_after: 'Unlikely',
    consequence_after: 'Insignificant',
  };

  it('parses valid risk form data', () => {
    const result = parseRiskFormData(validInput);
    expect(result.risk).toBe('Venue access delay');
    expect(result.type).toBe('Operational');
  });

  it('validation failure: invalid enum rejected', () => {
    expect(() =>
      parseRiskFormData({
        ...validInput,
        likelihood_before: 'High' as RiskFormInput['likelihood_before'],
      })
    ).toThrow(/valid likelihood/i);
  });

  it('validation failure: missing risk description', () => {
    expect(() =>
      parseRiskFormData({
        ...validInput,
        risk: '',
      })
    ).toThrow(/required/i);
  });
});
