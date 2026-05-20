import { describe, expect, it } from 'vitest';
import { computeCostRollup, computeAveragePerParticipant } from '@/features/costs';

describe('costs consumer export (TR07 verification)', () => {
  it('exports computeCostRollup for downstream SLICE-02/10 consumers', () => {
    const result = computeCostRollup({
      baseCurrency: 'USD',
      approvedParticipantCount: 2,
      rates: [{ currency_code: 'USD', exchange_rate: 1 }],
      assignments: [
        {
          resource_type: 'transport',
          resource_id: 't1',
          application_id: 'app-1',
        },
      ],
      lines: [
        {
          resourceType: 'transport',
          resourceId: 't1',
          currency: 'USD',
          individual_cost: 10,
          group_cost: 20,
        },
      ],
    });

    expect(result.eventTotalBase).toBe(30);
    expect(result.participantTotalsByApplicationId['app-1']).toBe(30);
    expect(computeAveragePerParticipant(result.eventTotalBase, 2)).toBe(15);
  });
});
