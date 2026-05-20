/**
 * SLICE-07 currency rates integration tests (TR07 testing requirements).
 */
import { describe, it, expect } from 'vitest';
import { parseCurrencyRateFormData } from '@/features/costs/currency-rate-schema';

describe('currency-rates integration (TR07)', () => {
  it('validation failure: invalid rate input rejected before mutation', () => {
    expect(() => parseCurrencyRateFormData({ currency_code: 'US', exchange_rate: 1 })).toThrow();
    expect(() => parseCurrencyRateFormData({ currency_code: 'USD', exchange_rate: 0 })).toThrow(
      /greater than zero/i
    );
  });

  it('validation failure: non-numeric exchange rate rejected', () => {
    expect(() =>
      parseCurrencyRateFormData({ currency_code: 'USD', exchange_rate: 'not-a-number' })
    ).toThrow();
  });
});
