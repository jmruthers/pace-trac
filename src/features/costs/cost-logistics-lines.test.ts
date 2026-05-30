import { describe, expect, it } from 'vitest';
import { toCostLogisticsLine } from '@/features/costs/cost-logistics-lines';
import { computeCostRollup } from '@/features/costs/cost-rollup';

describe('cost-logistics-lines (TR07)', () => {
  it('maps transport row to labelled line with route display', () => {
    const line = toCostLogisticsLine(
      {
        id: 't1',
        currency: 'AUD',
        individual_cost: 50,
        group_cost: 100,
        departure_display_name: 'Sydney',
        arrival_display_name: 'London',
      },
      'transport'
    );

    expect(line.resourceId).toBe('t1');
    expect(line.label).toBe('Sydney → London');
    expect(line.currency).toBe('AUD');
  });

  it('uses activity name when present', () => {
    const line = toCostLogisticsLine(
      {
        id: 'a1',
        name: '  Harbour tour  ',
        currency: 'USD',
        individual_cost: 10,
        group_cost: 0,
      },
      'activity'
    );

    expect(line.label).toBe('Harbour tour');
  });

  it('feeds rollup with null costs normalized via computeCostRollup', () => {
    const line = toCostLogisticsLine(
      {
        id: 'h1',
        currency: 'JPY',
        individual_cost: null,
        group_cost: null,
      },
      'accommodation'
    );

    const result = computeCostRollup({
      baseCurrency: 'JPY',
      approvedParticipantCount: 0,
      rates: [],
      assignments: [],
      lines: [line],
    });

    expect(result.eventTotalBase).toBe(0);
    expect(result.rowBreakdowns[0]?.rowTotalBase).toBe(0);
  });

  it('rollup respects minor units for 3-decimal BHD (line round then sum)', () => {
    const buildLine = (id: string, amount: number) =>
      toCostLogisticsLine(
        {
          id,
          currency: 'BHD',
          individual_cost: amount,
          group_cost: 0,
        },
        'activity'
      );

    const assignments = [
      { resource_type: 'activity' as const, resource_id: 'a1', application_id: 'app-1' },
      { resource_type: 'activity' as const, resource_id: 'a2', application_id: 'app-1' },
    ];
    const lines = [buildLine('a1', 10.004), buildLine('a2', 10.004)];

    const bhd = computeCostRollup({
      baseCurrency: 'BHD',
      approvedParticipantCount: 1,
      rates: [{ currency_code: 'BHD', exchange_rate: 1 }],
      assignments,
      lines,
    });
    expect(bhd.eventTotalBase).toBe(20.008);

    const usd = computeCostRollup({
      baseCurrency: 'USD',
      approvedParticipantCount: 1,
      rates: [],
      assignments,
      lines: lines.map((line) => ({ ...line, currency: 'USD' })),
    });
    expect(usd.eventTotalBase).toBe(20);

    const jpy = computeCostRollup({
      baseCurrency: 'JPY',
      approvedParticipantCount: 1,
      rates: [],
      assignments,
      lines: lines.map((line) => ({ ...line, currency: 'JPY' })),
    });
    expect(jpy.eventTotalBase).toBe(20);
  });
});
