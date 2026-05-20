import { describe, expect, it } from 'vitest';
import {
  buildRatesByCode,
  computeCostRollup,
  computeParticipantShareNative,
  computeRowEventTotalNative,
  convertToBase,
  normalizeCost,
} from '@/features/costs/cost-rollup';

describe('cost-rollup', () => {
  it('treats null costs as zero', () => {
    expect(normalizeCost(null)).toBe(0);
    expect(computeRowEventTotalNative(null, null, 2)).toBe(0);
  });

  it('computes row event total as group + individual * assigned_count', () => {
    expect(computeRowEventTotalNative(10, 100, 3)).toBe(130);
  });

  it('returns null participant share when assigned_count is zero', () => {
    expect(computeParticipantShareNative(10, 100, 0)).toBeNull();
  });

  it('computes R2 participant share', () => {
    expect(computeParticipantShareNative(10, 100, 4)).toBe(35);
  });

  it('converts foreign currency to base using exchange rate', () => {
    const rates = buildRatesByCode([{ currency_code: 'USD', exchange_rate: 1.5 }]);
    const result = convertToBase(100, 'USD', 'AUD', rates);
    expect(result.missingRate).toBe(false);
    expect(result.amountBase).toBe(150);
  });

  it('flags missing rate when foreign currency has no rate row', () => {
    const rates = buildRatesByCode([]);
    const result = convertToBase(100, 'USD', 'AUD', rates);
    expect(result.missingRate).toBe(true);
  });

  it('differs from sum-then-round when line-level rounding applies', () => {
    const lines = [
      {
        resourceType: 'transport' as const,
        resourceId: 't1',
        currency: 'USD',
        individual_cost: 10.004,
        group_cost: 0,
      },
      {
        resourceType: 'activity' as const,
        resourceId: 'a1',
        currency: 'USD',
        individual_cost: 10.004,
        group_cost: 0,
      },
    ];
    const assignments = [
      {
        resource_type: 'transport' as const,
        resource_id: 't1',
        application_id: 'app-1',
      },
      {
        resource_type: 'activity' as const,
        resource_id: 'a1',
        application_id: 'app-1',
      },
    ];
    const rounded = computeCostRollup({
      baseCurrency: 'USD',
      approvedParticipantCount: 1,
      rates: [],
      assignments,
      lines,
    });
    const rawTotal = 20.008;
    const sumThenRound = Math.round(rawTotal * 100) / 100;
    expect(rounded.eventTotalBase).toBe(20);
    expect(sumThenRound).toBe(20.01);
    expect(rounded.eventTotalBase).not.toBe(sumThenRound);
  });

  it('uses line-level rounding then sum for event total', () => {
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
        {
          resource_type: 'activity',
          resource_id: 'a1',
          application_id: 'app-1',
        },
      ],
      lines: [
        {
          resourceType: 'transport',
          resourceId: 't1',
          currency: 'USD',
          individual_cost: 10.004,
          group_cost: 20.006,
          label: 'Flight',
        },
        {
          resourceType: 'activity',
          resourceId: 'a1',
          currency: 'USD',
          individual_cost: 5.004,
          group_cost: 0,
          label: 'Tour',
        },
      ],
    });

    expect(result.eventTotalBase).toBe(35.01);
    expect(result.participantTotalsByApplicationId['app-1']).toBe(35.01);
  });

  it('handles assigned_count zero with group_cost only and unallocated flag', () => {
    const result = computeCostRollup({
      baseCurrency: 'USD',
      approvedParticipantCount: 0,
      rates: [],
      assignments: [],
      lines: [
        {
          resourceType: 'accommodation',
          resourceId: 'h1',
          currency: 'USD',
          individual_cost: 50,
          group_cost: 200,
          label: 'Hotel',
        },
      ],
    });

    expect(result.eventTotalBase).toBe(200);
    expect(result.rowBreakdowns[0]?.hasUnallocatedGroupCost).toBe(true);
    expect(result.rowBreakdowns[0]?.assignedCount).toBe(0);
    expect(Object.keys(result.participantTotalsByApplicationId)).toHaveLength(0);
  });

  it('supports both group and individual cost on the same row', () => {
    const result = computeCostRollup({
      baseCurrency: 'USD',
      approvedParticipantCount: 1,
      rates: [],
      assignments: [
        {
          resource_type: 'activity',
          resource_id: 'a1',
          application_id: 'app-1',
        },
        {
          resource_type: 'activity',
          resource_id: 'a1',
          application_id: 'app-2',
        },
      ],
      lines: [
        {
          resourceType: 'activity',
          resourceId: 'a1',
          currency: 'USD',
          individual_cost: 20,
          group_cost: 100,
        },
      ],
    });

    expect(result.eventTotalBase).toBe(140);
    expect(result.participantTotalsByApplicationId['app-1']).toBe(70);
    expect(result.participantTotalsByApplicationId['app-2']).toBe(70);
  });

  it('excludes rows with missing rates from event total', () => {
    const result = computeCostRollup({
      baseCurrency: 'USD',
      approvedParticipantCount: 0,
      rates: [],
      assignments: [],
      lines: [
        {
          resourceType: 'transport',
          resourceId: 't1',
          currency: 'EUR',
          individual_cost: 0,
          group_cost: 100,
        },
      ],
    });

    expect(result.eventTotalBase).toBe(0);
    expect(result.rowBreakdowns[0]?.missingRate).toBe(true);
    expect(result.rowBreakdowns[0]?.rowTotalBase).toBeNull();
  });
});
