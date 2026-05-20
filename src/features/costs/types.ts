import type { LogisticsResourceKind } from '@/features/planning/types';

export interface CostLogisticsLine {
  resourceType: LogisticsResourceKind;
  resourceId: string;
  currency: string | null;
  individual_cost: number | null;
  group_cost: number | null;
  label?: string;
}

export interface CostAssignmentRef {
  resource_type: LogisticsResourceKind;
  resource_id: string;
  application_id: string;
}

export interface CurrencyRate {
  currency_code: string;
  exchange_rate: number;
}

export interface CostRowBreakdown {
  resourceType: LogisticsResourceKind;
  resourceId: string;
  label?: string;
  currency: string | null;
  assignedCount: number;
  rowTotalNative: number;
  rowTotalBase: number | null;
  hasUnallocatedGroupCost: boolean;
  missingRate: boolean;
}

export interface CostRollupResult {
  baseCurrency: string;
  eventTotalBase: number;
  participantTotalsByApplicationId: Record<string, number>;
  rowBreakdowns: CostRowBreakdown[];
  approvedParticipantCount: number;
  participantsWithAllocation: number;
}

export interface CurrencyRateRow extends Record<string, unknown> {
  id: string;
  event_id: string;
  organisation_id: string;
  currency_code: string;
  exchange_rate: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CurrencyRateFormData {
  currency_code: string;
  exchange_rate: number;
}
