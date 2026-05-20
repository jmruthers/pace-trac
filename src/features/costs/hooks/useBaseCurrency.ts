import { useQuery } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { costsQueryKeys } from '@/features/costs/cost-query-keys';
import { useCostsScope } from '@/features/costs/hooks/useCostsScope';
import { asCostsReadClient } from '@/features/costs/supabase-costs-read-client';

export function useBaseCurrency() {
  const secureSupabase = asCostsReadClient(useSecureSupabase());
  const { organisationId, isReady } = useCostsScope();

  const query = useQuery({
    queryKey: costsQueryKeys.baseCurrency(organisationId ?? ''),
    enabled: Boolean(secureSupabase && isReady && organisationId),
    queryFn: async (): Promise<string> => {
      if (secureSupabase == null || organisationId == null) {
        throw new Error('Organisation context not available');
      }

      const { data, error } = await secureSupabase.rpc('data_core_org_settings_base_currency', {
        p_organisation_id: organisationId,
      });

      if (error != null) {
        throw new Error(error.message);
      }

      if (typeof data !== 'string' || data.trim() === '') {
        throw new Error('Event base currency is not configured for this organisation');
      }

      return data.trim().toUpperCase();
    },
    staleTime: 60_000,
    retry: 1,
  });

  return {
    baseCurrency: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
