import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useResourcePermissions, useSecureSupabase } from '@solvera/pace-core/rbac';
import { costsQueryKeys, TRAC_COSTS_QUERY_PREFIX } from '@/features/costs/cost-query-keys';
import { parseCurrencyRateFormData } from '@/features/costs/currency-rate-schema';
import { useCostsScope } from '@/features/costs/hooks/useCostsScope';
import { currencyRatesTable } from '@/features/costs/supabase-costs-client';
import type { CurrencyRateFormData, CurrencyRateRow } from '@/features/costs/types';

const CURRENCY_RATES_PAGE = 'currency-rates';

function toFormInput(row: Partial<CurrencyRateRow>): CurrencyRateFormData {
  return parseCurrencyRateFormData({
    currency_code: row.currency_code ?? '',
    exchange_rate: row.exchange_rate ?? '',
  });
}

export function useCurrencyRates() {
  const secureSupabase = useSecureSupabase();
  const { eventId, organisationId, isReady } = useCostsScope();
  const {
    canCreate,
    canUpdate,
    canDelete,
    isLoading: permissionsLoading,
  } = useResourcePermissions(CURRENCY_RATES_PAGE);
  const queryClient = useQueryClient();

  const ratesQueryKey = eventId != null ? costsQueryKeys.rates(eventId) : ['trac-costs', 'rates', 'none'];

  const {
    data: rates = [],
    isLoading,
    error: queryError,
    refetch: refetchRates,
  } = useQuery<CurrencyRateRow[]>({
    queryKey: ratesQueryKey,
    queryFn: async () => {
      if (eventId == null) return [];
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { data, error } = await currencyRatesTable(secureSupabase)
        .select('*')
        .eq('event_id', eventId)
        .order('currency_code', { ascending: true });

      if (error != null) {
        throw new Error(error.message);
      }

      return (data ?? []) as CurrencyRateRow[];
    },
    enabled: eventId != null && isReady && secureSupabase != null,
    staleTime: 30_000,
    retry: 1,
  });

  const invalidateCosts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: TRAC_COSTS_QUERY_PREFIX });
  }, [queryClient]);

  const addRateMutation = useMutation({
    mutationFn: async (formData: CurrencyRateFormData): Promise<CurrencyRateRow> => {
      if (eventId == null) throw new Error('No event selected');
      if (organisationId == null || organisationId === '') {
        throw new Error('No organisation context available');
      }
      if (permissionsLoading) {
        throw new Error('Permission check in progress. Please wait…');
      }
      if (!canCreate) {
        throw new Error('Permission denied: You do not have permission to create currency rates.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const payload = parseCurrencyRateFormData(formData);

      const { data, error } = await currencyRatesTable(secureSupabase)
        .insert([
          {
            ...payload,
            event_id: eventId,
            organisation_id: organisationId,
          },
        ])
        .select()
        .single();

      if (error != null) {
        throw new Error(error.message);
      }

      return data as CurrencyRateRow;
    },
    onSuccess: () => void invalidateCosts(),
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: CurrencyRateFormData;
    }): Promise<CurrencyRateRow> => {
      if (eventId == null) throw new Error('No event selected');
      if (!canUpdate) {
        throw new Error('Permission denied: You do not have permission to update currency rates.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const payload = parseCurrencyRateFormData(formData);

      const { data, error } = await currencyRatesTable(secureSupabase)
        .update(payload)
        .eq('id', id)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error != null) {
        throw new Error(error.message);
      }

      return data as CurrencyRateRow;
    },
    onSuccess: () => void invalidateCosts(),
  });

  const deleteRateMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (eventId == null) throw new Error('No event selected');
      if (!canDelete) {
        throw new Error('Permission denied: You do not have permission to delete currency rates.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { error } = await currencyRatesTable(secureSupabase)
        .delete()
        .eq('id', id)
        .eq('event_id', eventId);

      if (error != null) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => void invalidateCosts(),
  });

  const addRate = useCallback(
    async (formData: CurrencyRateFormData) => addRateMutation.mutateAsync(formData),
    [addRateMutation]
  );

  const updateRate = useCallback(
    async (id: string, formData: CurrencyRateFormData) =>
      updateRateMutation.mutateAsync({ id, formData }),
    [updateRateMutation]
  );

  const deleteRate = useCallback(
    async (id: string) => deleteRateMutation.mutateAsync(id),
    [deleteRateMutation]
  );

  return {
    rates,
    isLoading,
    error:
      queryError instanceof Error
        ? queryError.message
        : queryError != null
          ? String(queryError)
          : null,
    refreshRates: refetchRates,
    addRate,
    updateRate,
    deleteRate,
    toFormInput,
    canCreate,
    canUpdate,
    canDelete,
    isSaving:
      addRateMutation.isPending || updateRateMutation.isPending || deleteRateMutation.isPending,
  };
}
