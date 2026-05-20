import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { computeCostRollup } from '@/features/costs/cost-rollup';
import { costsQueryKeys } from '@/features/costs/cost-query-keys';
import { toCostLogisticsLine } from '@/features/costs/cost-logistics-lines';
import { useBaseCurrency } from '@/features/costs/hooks/useBaseCurrency';
import { useCostsScope } from '@/features/costs/hooks/useCostsScope';
import { asCostsReadClient } from '@/features/costs/supabase-costs-read-client';
import type { CostAssignmentRef, CostRollupResult, CurrencyRate } from '@/features/costs/types';
import { asPlanningClient } from '@/features/planning/supabase-helpers';
import type { LogisticsResourceKind } from '@/features/planning/types';
import { LOGISTICS_TABLE_BY_KIND } from '@/features/planning/types';

const APPROVED_STATUS = 'approved';

const LOGISTICS_KINDS: LogisticsResourceKind[] = ['transport', 'accommodation', 'activity'];

async function fetchLogisticsLines(
  client: NonNullable<ReturnType<typeof asPlanningClient>>,
  eventId: string
) {
  const results = await Promise.all(
    LOGISTICS_KINDS.map(async (kind) => {
      const table = LOGISTICS_TABLE_BY_KIND[kind];
      const orderColumn =
        kind === 'transport' ? 'departure_time' : kind === 'accommodation' ? 'check_in_time' : 'start_time';
      const { data, error } = await client
        .from(table)
        .select('id, currency, individual_cost, group_cost, name, departure_display_name, arrival_display_name')
        .eq('event_id', eventId)
        .order(orderColumn, { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => toCostLogisticsLine(row, kind));
    })
  );
  return results.flat();
}

export function useCostRollupData() {
  const planningClient = asPlanningClient(useSecureSupabase());
  const costsClient = asCostsReadClient(useSecureSupabase());
  const { eventId, isReady } = useCostsScope();
  const {
    baseCurrency,
    isLoading: baseCurrencyLoading,
    isError: baseCurrencyError,
    error: baseCurrencyQueryError,
  } = useBaseCurrency();

  const query = useQuery({
    queryKey: costsQueryKeys.rollup(eventId ?? ''),
    enabled: Boolean(planningClient && costsClient && isReady && eventId && baseCurrency),
    queryFn: async (): Promise<CostRollupResult> => {
      if (!planningClient || !costsClient || !eventId || !baseCurrency) {
        throw new Error('Cost rollup prerequisites not available');
      }

      const [lines, assignmentsResult, ratesResult, approvedResult] = await Promise.all([
        fetchLogisticsLines(planningClient, eventId),
        costsClient
          .from('trac_itinerary_assignment')
          .select('resource_type, resource_id, application_id')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true }),
        costsClient
          .from('trac_currency_rates')
          .select('currency_code, exchange_rate')
          .eq('event_id', eventId)
          .order('currency_code', { ascending: true }),
        costsClient
          .from('base_application')
          .select('id')
          .eq('event_id', eventId)
          .eq('status', APPROVED_STATUS)
          .order('id', { ascending: true }),
      ]);

      if (assignmentsResult.error) throw new Error(assignmentsResult.error.message);
      if (ratesResult.error) throw new Error(ratesResult.error.message);
      if (approvedResult.error) throw new Error(approvedResult.error.message);

      const assignments = (assignmentsResult.data ?? []).map(
        (row: Record<string, unknown>): CostAssignmentRef => ({
          resource_type: row.resource_type as CostAssignmentRef['resource_type'],
          resource_id: String(row.resource_id),
          application_id: String(row.application_id),
        })
      );

      const rates = (ratesResult.data ?? []).map(
        (row: Record<string, unknown>): CurrencyRate => ({
          currency_code: String(row.currency_code),
          exchange_rate: Number(row.exchange_rate),
        })
      );

      const approvedParticipantCount = (approvedResult.data ?? []).length;

      return computeCostRollup({
        lines,
        assignments,
        rates,
        baseCurrency,
        approvedParticipantCount,
      });
    },
    staleTime: 30_000,
    retry: 1,
  });

  const errorMessage = useMemo(() => {
    if (baseCurrencyQueryError instanceof Error) return baseCurrencyQueryError.message;
    if (query.error instanceof Error) return query.error.message;
    if (query.error != null) return String(query.error);
    return null;
  }, [baseCurrencyQueryError, query.error]);

  return {
    rollup: query.data ?? null,
    baseCurrency,
    isLoading: baseCurrencyLoading || query.isLoading,
    isError: baseCurrencyError || query.isError,
    error: errorMessage,
    refetch: query.refetch,
  };
}
