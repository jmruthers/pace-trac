import { describe, expect, it } from 'vitest';
import { formatMasterPlanEventDateRange } from '@/features/master-plan/format-event-date-range';

describe('formatMasterPlanEventDateRange (TR10 unit)', () => {
  it('formats a single day when start and end are the same calendar day', () => {
    const result = formatMasterPlanEventDateRange({
      startDate: '2026-05-21',
      endDate: '2026-05-21',
    });
    expect(result).not.toContain('–');
    expect(result).toMatch(/May/);
  });

  it('formats a range when start and end differ', () => {
    const result = formatMasterPlanEventDateRange({
      startDate: '2026-05-21',
      endDate: '2026-05-25',
    });
    expect(result).toContain('–');
  });

  it('returns fallback when start date is missing', () => {
    expect(
      formatMasterPlanEventDateRange({
        startDate: null,
        endDate: '2026-05-25',
      })
    ).toBe('Dates not available');
  });
});
