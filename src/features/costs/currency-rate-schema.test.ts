import { describe, expect, it } from 'vitest';
import { parseCurrencyRateFormData } from '@/features/costs/currency-rate-schema';

describe('currency-rate-schema', () => {
  it('accepts valid rate input', () => {
    expect(parseCurrencyRateFormData({ currency_code: 'usd', exchange_rate: '1.25' })).toEqual({
      currency_code: 'USD',
      exchange_rate: 1.25,
    });
  });

  it('rejects invalid currency code', () => {
    expect(() => parseCurrencyRateFormData({ currency_code: 'US', exchange_rate: 1 })).toThrow(
      /3 letters/i
    );
  });

  it('rejects non-positive exchange rate', () => {
    expect(() => parseCurrencyRateFormData({ currency_code: 'USD', exchange_rate: 0 })).toThrow(
      /greater than zero/i
    );
    expect(() => parseCurrencyRateFormData({ currency_code: 'USD', exchange_rate: -1 })).toThrow(
      /greater than zero/i
    );
  });
});
