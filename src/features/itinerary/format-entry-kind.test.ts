import { describe, expect, it } from 'vitest';
import { isSameLocalDay } from '@/features/itinerary/format-entry-kind';

describe('format-entry-kind', () => {
  it('isSameLocalDay returns true for same calendar day in timezone', () => {
    expect(
      isSameLocalDay('2026-06-03T09:00:00.000Z', '2026-06-03T21:00:00.000Z', 'Europe/London')
    ).toBe(true);
  });

  it('isSameLocalDay returns false across different days', () => {
    expect(
      isSameLocalDay('2026-06-03T09:00:00.000Z', '2026-06-04T09:00:00.000Z', 'Europe/London')
    ).toBe(false);
  });
});
