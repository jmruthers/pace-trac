import { describe, expect, it } from 'vitest';
import { formatResourceTypeLabel } from '@/features/costs/cost-labels';

describe('cost-labels', () => {
  it('formats logistics resource kinds for display', () => {
    expect(formatResourceTypeLabel('transport')).toBe('Transport');
    expect(formatResourceTypeLabel('accommodation')).toBe('Accommodation');
    expect(formatResourceTypeLabel('activity')).toBe('Activity');
  });
});
