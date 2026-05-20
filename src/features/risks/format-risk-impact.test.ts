import { describe, it, expect } from 'vitest';
import { formatRiskImpact } from '@/features/risks/format-risk-impact';

describe('formatRiskImpact', () => {
  it('formats generated impact scores from a mocked row', () => {
    const display = formatRiskImpact({
      impact_before: 12,
      impact_after: 4,
    });
    expect(display).toEqual({ before: '12', after: '4' });
  });

  it('shows em dash when impacts are not yet available', () => {
    const display = formatRiskImpact({
      impact_before: null,
      impact_after: null,
    });
    expect(display).toEqual({ before: '—', after: '—' });
  });
});
