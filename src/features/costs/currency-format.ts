import { formatCurrency } from '@solvera/pace-core/utils';

/** ISO 4217 minor-unit exponents for currencies used in TR07 tests and common cases. */
const MINOR_UNIT_OVERRIDES: Record<string, number> = {
  JPY: 0,
  KRW: 0,
  BHD: 3,
  JOD: 3,
  KWD: 3,
  OMR: 3,
  TND: 3,
};

/**
 * Returns currency minor-unit precision (0, 2, or 3 for TR07 fixtures).
 * Uses known overrides first, then Intl when available.
 */
export function getCurrencyMinorUnits(currencyCode: string): number {
  const code = currencyCode.trim().toUpperCase();
  if (code in MINOR_UNIT_OVERRIDES) {
    return MINOR_UNIT_OVERRIDES[code]!;
  }
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'code',
    }).formatToParts(1);
    const fraction = parts.find((part) => part.type === 'fraction');
    return fraction?.value.length ?? 2;
  } catch {
    return 2;
  }
}

/** Round to minor-unit precision using standard half-up rounding. */
export function roundMoney(amount: number, minorUnits: number): number {
  if (!Number.isFinite(amount)) return 0;
  const factor = 10 ** minorUnits;
  return Math.round(amount * factor) / factor;
}

/** Format a rounded monetary amount using pace-core currency formatting. */
export function formatCostAmount(amount: number, currencyCode: string): string {
  const code = currencyCode.trim().toUpperCase();
  const minorUnits = getCurrencyMinorUnits(code);
  const rounded = roundMoney(amount, minorUnits);
  return formatCurrency(rounded, code);
}

/**
 * Dashboard / Master Plan headline average: event total divided by approved participant count.
 * Returns 0 when denominator is zero.
 */
export function computeAveragePerParticipant(
  eventTotalBase: number,
  approvedParticipantCount: number
): number {
  if (approvedParticipantCount <= 0) return 0;
  return eventTotalBase / approvedParticipantCount;
}
