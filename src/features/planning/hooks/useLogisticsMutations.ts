import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { invalidatePlanningAndDependents } from '@/features/planning/invalidation';
import { writeLocationCacheBestEffort } from '@/features/planning/location-cache';
import { usePlanningScope } from '@/features/planning/hooks/usePlanningScope';
import { asPlanningClient } from '@/features/planning/supabase-helpers';
import {
  LOGISTICS_TABLE_BY_KIND,
  type LogisticsResourceKind,
  type PlanningPlaceValue,
} from '@/features/planning/types';

async function persistPlaces(
  secureSupabase: NonNullable<ReturnType<typeof asPlanningClient>>,
  places: PlanningPlaceValue[]
): Promise<void> {
  await Promise.all(
    places.map(async (place) => {
      if (!place.placeId) return;
      await writeLocationCacheBestEffort(secureSupabase, place);
    })
  );
}

function useLogisticsMutations(kind: LogisticsResourceKind) {
  const secureSupabase = asPlanningClient(useSecureSupabase());
  const queryClient = useQueryClient();
  const { eventId, organisationId, isReady } = usePlanningScope();
  const table = LOGISTICS_TABLE_BY_KIND[kind];

  const afterSuccess = async () => {
    if (eventId) {
      await invalidatePlanningAndDependents(queryClient, eventId);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (input: {
      row: Record<string, unknown>;
      places?: PlanningPlaceValue[];
    }) => {
      if (!secureSupabase || !isReady || !eventId || !organisationId) {
        throw new Error('Event scope is not ready');
      }
      const payload = {
        ...input.row,
        event_id: eventId,
        organisation_id: organisationId,
      };
      const { data, error } = await secureSupabase
        .from(table)
        .insert(payload)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      if (input.places?.length) {
        await persistPlaces(secureSupabase, input.places);
      }
      return data;
    },
    onSuccess: afterSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      row: Record<string, unknown>;
      places?: PlanningPlaceValue[];
    }) => {
      if (!secureSupabase || !isReady) {
        throw new Error('Event scope is not ready');
      }
      const { data, error } = await secureSupabase
        .from(table)
        .update(input.row)
        .eq('id', input.id)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      if (input.places?.length) {
        await persistPlaces(secureSupabase, input.places);
      }
      return data;
    },
    onSuccess: afterSuccess,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!secureSupabase || !isReady) {
        throw new Error('Event scope is not ready');
      }
      const { error } = await secureSupabase.from(table).delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: afterSuccess,
  });

  return {
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isSaving:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

export function useTransportMutations() {
  return useLogisticsMutations('transport');
}

export function useAccommodationMutations() {
  return useLogisticsMutations('accommodation');
}

export function useActivityMutations() {
  return useLogisticsMutations('activity');
}
