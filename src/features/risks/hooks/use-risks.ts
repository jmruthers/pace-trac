import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvents } from '@solvera/pace-core/hooks';
import { useResourcePermissions, useSecureSupabase } from '@solvera/pace-core/rbac';
import { assertNoGeneratedImpactKeys, toRiskWritePayload } from '@/features/risks/build-risk-payload';
import { parseRiskFormData } from '@/features/risks/risk-schema';
import { risksTable } from '@/features/risks/supabase-risks-client';
import type { Risk, RiskFormData } from '@/features/risks/types';
import { tracRisksQueryKey } from '@/features/contacts/contact-query-keys';

const RISKS_PAGE = 'risks';

export function useRisks() {
  const { selectedEvent, isLoading: eventLoading } = useEvents();
  const secureSupabase = useSecureSupabase();
  const {
    canCreate,
    canUpdate,
    canDelete,
    isLoading: permissionsLoading,
  } = useResourcePermissions(RISKS_PAGE);
  const queryClient = useQueryClient();

  const eventId = selectedEvent?.id;
  const organisationId = selectedEvent?.organisation_id;
  const risksQueryKey = eventId != null ? tracRisksQueryKey(eventId) : ['trac-risks', 'none'];

  const {
    data: risks = [],
    isLoading,
    error: queryError,
    refetch: refetchRisks,
  } = useQuery<Risk[]>({
    queryKey: risksQueryKey,
    queryFn: async () => {
      if (eventId == null) {
        return [];
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { data, error } = await risksTable(secureSupabase)
        .select('*')
        .eq('event_id', eventId)
        .order('risk', { ascending: true });

      if (error != null) {
        throw new Error(error.message);
      }

      return (data ?? []) as Risk[];
    },
    enabled: eventId != null && !eventLoading && secureSupabase != null,
    staleTime: 30_000,
    retry: 1,
  });

  const invalidateRisks = useCallback(() => {
    if (eventId != null) {
      void queryClient.invalidateQueries({ queryKey: tracRisksQueryKey(eventId) });
    }
  }, [eventId, queryClient]);

  const addRiskMutation = useMutation({
    mutationFn: async (formData: RiskFormData): Promise<Risk> => {
      if (eventId == null) {
        throw new Error('No event selected');
      }
      if (organisationId == null || organisationId === '') {
        throw new Error('No organisation context available');
      }
      if (permissionsLoading) {
        throw new Error('Permission check in progress. Please wait…');
      }
      if (!canCreate) {
        throw new Error('Permission denied: You do not have permission to create risks.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const parsed = parseRiskFormData(formData);
      const payload = toRiskWritePayload(parsed);
      assertNoGeneratedImpactKeys(payload);

      const { data, error } = await risksTable(secureSupabase)
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

      return data as Risk;
    },
    onSuccess: invalidateRisks,
  });

  const updateRiskMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: string;
      formData: RiskFormData;
    }): Promise<Risk> => {
      if (eventId == null) {
        throw new Error('No event selected');
      }
      if (!canUpdate) {
        throw new Error('Permission denied: You do not have permission to update risks.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const parsed = parseRiskFormData(formData);
      const payload = toRiskWritePayload(parsed);
      assertNoGeneratedImpactKeys(payload);

      const { data, error } = await risksTable(secureSupabase)
        .update(payload)
        .eq('id', id)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error != null) {
        throw new Error(error.message);
      }

      return data as Risk;
    },
    onSuccess: invalidateRisks,
  });

  const deleteRiskMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (eventId == null) {
        throw new Error('No event selected');
      }
      if (!canDelete) {
        throw new Error('Permission denied: You do not have permission to delete risks.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { error } = await risksTable(secureSupabase)
        .delete()
        .eq('id', id)
        .eq('event_id', eventId);

      if (error != null) {
        throw new Error(error.message);
      }
    },
    onSuccess: invalidateRisks,
  });

  const addRisk = useCallback(
    async (formData: RiskFormData): Promise<Risk> => addRiskMutation.mutateAsync(formData),
    [addRiskMutation]
  );

  const updateRisk = useCallback(
    async (id: string, formData: RiskFormData): Promise<Risk> =>
      updateRiskMutation.mutateAsync({ id, formData }),
    [updateRiskMutation]
  );

  const deleteRisk = useCallback(
    async (id: string): Promise<void> => deleteRiskMutation.mutateAsync(id),
    [deleteRiskMutation]
  );

  return {
    risks,
    isLoading,
    error:
      queryError instanceof Error
        ? queryError.message
        : queryError != null
          ? String(queryError)
          : null,
    refreshRisks: refetchRisks,
    addRisk,
    updateRisk,
    deleteRisk,
    isSaving:
      addRiskMutation.isPending || updateRiskMutation.isPending || deleteRiskMutation.isPending,
  };
}
