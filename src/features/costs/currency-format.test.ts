import { describe, expect, it } from 'vitest';
import {
  computeAveragePerParticipant,
  formatCostAmount,
  getCurrencyMinorUnits,
  roundMoney,
} from '@/features/costs/currency-format';

describe('currency-format', () => {
  it('returns minor units for 0/2/3-decimal currencies', () => {
    expect(getCurrencyMinorUnits('JPY')).toBe(0);
    expect(getCurrencyMinorUnits('USD')).toBe(2);
    expect(getCurrencyMinorUnits('BHD')).toBe(3);
  });

  it('rounds to minor-unit precision', () => {
    expect(roundMoney(1.2345, 2)).toBe(1.23);
    expect(roundMoney(1.2345, 3)).toBe(1.235);
    expect(roundMoney(99.6, 0)).toBe(100);
  });

  it('formats money using dynamic currency code', () => {
    const formatted = formatCostAmount(1234.5, 'USD');
    expect(formatted).toContain('1');
    expect(formatted).not.toMatch(/AUD/);
  });

  it('computes average per participant with zero denominator guard', () => {
    expect(computeAveragePerParticipant(1000, 4)).toBe(250);
    expect(computeAveragePerParticipant(1000, 0)).toBe(0);
  });
});
