import { describe, expect, it } from 'vitest';
import {
  transportFormSchema,
  validateCapacityForSubmit,
  validateTracStatusForSubmit,
} from '@/features/planning/validation';

describe('planning validation', () => {
  it('rejects invalid trac_status on transport form', () => {
    const result = transportFormSchema.safeParse({
      mode: 'Flight',
      transport_number: '',
      departure_time: new Date('2026-05-01T08:00:00Z'),
      arrival_time: new Date('2026-05-01T12:00:00Z'),
      departure_label: 'A',
      arrival_label: 'B',
      status: 'not-a-status',
      capacity: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive capacity', () => {
    const result = validateCapacityForSubmit(0);
    expect(result.ok).toBe(false);
    expect(result.message).toBeTruthy();
  });

  it('allows null capacity (uncapped)', () => {
    expect(validateCapacityForSubmit(null).ok).toBe(true);
  });

  it('rejects invalid status helper', () => {
    expect(validateTracStatusForSubmit('bogus').ok).toBe(false);
  });
});
