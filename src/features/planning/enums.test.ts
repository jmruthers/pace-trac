import { describe, expect, it } from 'vitest';
import {
  isTracStatus,
  isTransportMode,
  normalizeTransportMode,
  TRAC_STATUS_VALUES,
} from '@/features/planning/enums';

describe('planning enums', () => {
  it('accepts valid trac_status values', () => {
    for (const status of TRAC_STATUS_VALUES) {
      expect(isTracStatus(status)).toBe(true);
    }
  });

  it('rejects invalid trac_status values', () => {
    expect(isTracStatus('completed')).toBe(false);
    expect(isTracStatus('')).toBe(false);
  });

  it('normalizes transport mode case-insensitively', () => {
    expect(normalizeTransportMode('flight')).toBe('Flight');
    expect(isTransportMode('Bus')).toBe(true);
  });
});
