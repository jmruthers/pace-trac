import { getCurrencyMinorUnits, roundMoney } from '@/features/costs/currency-format';
import type {
  CostAssignmentRef,
  CostLogisticsLine,
  CostRollupResult,
  CostRowBreakdown,
  CurrencyRate,
} from '@/features/costs/types';

export function normalizeCost(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return value;
}

export function normalizeCurrencyCode(currency: string | null | undefined): string | null {
  if (currency == null) return null;
  const trimmed = currency.trim().toUpperCase();
  return trimmed === '' ? null : trimmed;
}

export function buildRatesByCode(rates: readonly CurrencyRate[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const rate of rates) {
    const code = rate.currency_code.trim().toUpperCase();
    if (code !== '' && Number.isFinite(rate.exchange_rate)) {
      map.set(code, rate.exchange_rate);
    }
  }
  return map;
}

/**
 * Converts an amount from row currency to event base currency.
 * Foreign amount is multiplied by exchange_rate (rate = base units per 1 foreign unit).
 */
export function convertToBase(
  amount: number,
  fromCurrency: string | null,
  baseCurrency: string,
  ratesByCode: ReadonlyMap<string, number>
): { amountBase: number; missingRate: boolean } {
  const base = baseCurrency.trim().toUpperCase();
  const from = normalizeCurrencyCode(fromCurrency) ?? base;

  if (from === base) {
    return { amountBase: amount, missingRate: false };
  }

  const rate = ratesByCode.get(from);
  if (rate == null) {
    return { amountBase: amount, missingRate: true };
  }

  return { amountBase: amount * rate, missingRate: false };
}

export function computeRowEventTotalNative(
  individualCost: number | null,
  groupCost: number | null,
  assignedCount: number
): number {
  const individual = normalizeCost(individualCost);
  const group = normalizeCost(groupCost);
  return group + individual * assignedCount;
}

export function computeParticipantShareNative(
  individualCost: number | null,
  groupCost: number | null,
  assignedCount: number
): number | null {
  if (assignedCount <= 0) return null;
  const individual = normalizeCost(individualCost);
  const group = normalizeCost(groupCost);
  return individual + group / assignedCount;
}

function countAssignmentsForResource(
  line: CostLogisticsLine,
  assignments: readonly CostAssignmentRef[]
): number {
  return assignments.filter(
    (row) => row.resource_type === line.resourceType && row.resource_id === line.resourceId
  ).length;
}

function assignmentsForResource(
  line: CostLogisticsLine,
  assignments: readonly CostAssignmentRef[]
): CostAssignmentRef[] {
  return assignments.filter(
    (row) => row.resource_type === line.resourceType && row.resource_id === line.resourceId
  );
}

function roundLineInBase(
  amountNative: number,
  currency: string | null,
  baseCurrency: string,
  ratesByCode: ReadonlyMap<string, number>
): { amountBase: number; missingRate: boolean } {
  const { amountBase, missingRate } = convertToBase(amountNative, currency, baseCurrency, ratesByCode);
  const minorUnits = getCurrencyMinorUnits(baseCurrency);
  return {
    amountBase: roundMoney(amountBase, minorUnits),
    missingRate,
  };
}

export interface ComputeCostRollupInput {
  lines: readonly CostLogisticsLine[];
  assignments: readonly CostAssignmentRef[];
  rates: readonly CurrencyRate[];
  baseCurrency: string;
  approvedParticipantCount: number;
}

export function computeCostRollup(input: ComputeCostRollupInput): CostRollupResult {
  const baseCurrency = input.baseCurrency.trim().toUpperCase();
  const ratesByCode = buildRatesByCode(input.rates);
  const minorUnits = getCurrencyMinorUnits(baseCurrency);

  let eventTotalBase = 0;
  const participantTotalsByApplicationId: Record<string, number> = {};
  const rowBreakdowns: CostRowBreakdown[] = [];

  for (const line of input.lines) {
    const assignedCount = countAssignmentsForResource(line, input.assignments);
    const rowTotalNative = computeRowEventTotalNative(
      line.individual_cost,
      line.group_cost,
      assignedCount
    );
    const group = normalizeCost(line.group_cost);
    const hasUnallocatedGroupCost = assignedCount === 0 && group > 0;

    const { amountBase: rowTotalBase, missingRate } = roundLineInBase(
      rowTotalNative,
      line.currency,
      baseCurrency,
      ratesByCode
    );

    if (!missingRate) {
      eventTotalBase = roundMoney(eventTotalBase + rowTotalBase, minorUnits);
    }

    rowBreakdowns.push({
      resourceType: line.resourceType,
      resourceId: line.resourceId,
      label: line.label,
      currency: normalizeCurrencyCode(line.currency),
      assignedCount,
      rowTotalNative,
      rowTotalBase: missingRate ? null : rowTotalBase,
      hasUnallocatedGroupCost,
      missingRate,
    });

    const resourceAssignments = assignmentsForResource(line, input.assignments);
    const shareNative = computeParticipantShareNative(
      line.individual_cost,
      line.group_cost,
      assignedCount
    );

    if (shareNative != null) {
      for (const assignment of resourceAssignments) {
        const { amountBase: shareBase, missingRate: shareMissing } = roundLineInBase(
          shareNative,
          line.currency,
          baseCurrency,
          ratesByCode
        );
        if (!shareMissing) {
          const current = participantTotalsByApplicationId[assignment.application_id] ?? 0;
          participantTotalsByApplicationId[assignment.application_id] = roundMoney(
            current + shareBase,
            minorUnits
          );
        }
      }
    }
  }

  const participantsWithAllocation = Object.values(participantTotalsByApplicationId).filter(
    (total) => total > 0
  ).length;

  return {
    baseCurrency,
    eventTotalBase: roundMoney(eventTotalBase, minorUnits),
    participantTotalsByApplicationId,
    rowBreakdowns,
    approvedParticipantCount: input.approvedParticipantCount,
    participantsWithAllocation,
  };
}
