import { describe, expect, it } from 'vitest';
import {
  formatHeadcountLine,
  getCapacityPressure,
  isUncapped,
  requiresOverCapacityConfirmation,
  wouldExceedCapacity,
} from '@/features/assignments/headcount';

describe('headcount', () => {
  it('treats null capacity as uncapped', () => {
    expect(isUncapped(null)).toBe(true);
    expect(wouldExceedCapacity(100, null, 1)).toBe(false);
    expect(getCapacityPressure(100, null)).toBe('ok');
  });

  it('detects over-capacity when adding would exceed cap', () => {
    expect(wouldExceedCapacity(10, 10, 1)).toBe(true);
    expect(requiresOverCapacityConfirmation(10, 10, 1)).toBe(true);
    expect(wouldExceedCapacity(9, 10, 1)).toBe(false);
  });

  it('reports pressure over when already above capacity', () => {
    expect(getCapacityPressure(11, 10)).toBe('over');
    expect(getCapacityPressure(10, 10)).toBe('over');
    expect(getCapacityPressure(9, 10)).toBe('near');
    expect(getCapacityPressure(5, 10)).toBe('ok');
  });

  it('formats headcount line for capped and uncapped', () => {
    expect(formatHeadcountLine(3, 10)).toBe('3 / 10 assigned');
    expect(formatHeadcountLine(3, null)).toBe('3 assigned (uncapped)');
  });
});
