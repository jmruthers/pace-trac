import { z } from '@solvera/pace-core/utils';
import type { CurrencyRateFormData } from '@/features/costs/types';

export const currencyRateFormSchema = z.object({
  currency_code: z
    .string()
    .trim()
    .length(3, 'Currency code must be exactly 3 letters')
    .regex(/^[A-Za-z]{3}$/, 'Currency code must be 3 letters')
    .transform((value) => value.toUpperCase()),
  exchange_rate: z.coerce
    .number({ message: 'Exchange rate is required' })
    .refine((value) => Number.isFinite(value), { message: 'Exchange rate must be a number' })
    .refine((value) => value > 0, { message: 'Exchange rate must be greater than zero' }),
});

export type CurrencyRateFormInput = z.input<typeof currencyRateFormSchema>;

export function parseCurrencyRateFormData(input: Partial<CurrencyRateFormInput>): CurrencyRateFormData {
  const result = currencyRateFormSchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join('; ');
    throw new Error(message);
  }
  return result.data;
}
