import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePageCan, useSecureSupabase } from '@solvera/pace-core/rbac';
import { mapAssignmentError } from '@/features/assignments/errors';
import { invalidateAssignmentsAndDependents } from '@/features/assignments/invalidation';
import { useAssignmentsScope } from '@/features/assignments/hooks/useAssignmentsScope';
import { asAssignmentsClient } from '@/features/assignments/supabase-helpers';
import type { AssignmentWriteInput } from '@/features/assignments/types';

const PLANNING_PAGE = 'planning';

export function useAssignmentMutations() {
  const secureSupabase = asAssignmentsClient(useSecureSupabase());
  const queryClient = useQueryClient();
  const { eventId, organisationId, isReady } = useAssignmentsScope();
  const { can: canCreate, isLoading: createLoading } = usePageCan(PLANNING_PAGE, 'create');
  const { can: canUpdate, isLoading: updateLoading } = usePageCan(PLANNING_PAGE, 'update');
  const { can: canDelete, isLoading: deleteLoading } = usePageCan(PLANNING_PAGE, 'delete');

  const afterSuccess = async () => {
    if (eventId) {
      await invalidateAssignmentsAndDependents(queryClient, eventId);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (input: AssignmentWriteInput) => {
      if (!secureSupabase || !isReady || !eventId || !organisationId) {
        throw new Error('Event scope is not ready');
      }
      if (createLoading) {
        throw new Error('Permission check in progress. Please wait…');
      }
      if (!canCreate) {
        throw new Error('Permission denied: You do not have permission to create assignments.');
      }

      const payload = {
        application_id: input.application_id,
        resource_type: input.resource_type,
        resource_id: input.resource_id,
        event_id: eventId,
        organisation_id: organisationId,
        notes: input.notes ?? null,
      };

      const { data, error } = await secureSupabase
        .from('trac_itinerary_assignment')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw mapAssignmentError(error);
      return data;
    },
    onSuccess: afterSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; notes: string | null }) => {
      if (!secureSupabase || !isReady || !eventId) {
        throw new Error('Event scope is not ready');
      }
      if (updateLoading) {
        throw new Error('Permission check in progress. Please wait…');
      }
      if (!canUpdate) {
        throw new Error('Permission denied: You do not have permission to update assignments.');
      }

      const { data, error } = await secureSupabase
        .from('trac_itinerary_assignment')
        .update({ notes: input.notes })
        .eq('id', input.id)
        .eq('event_id', eventId)
        .select('*')
        .single();

      if (error) throw mapAssignmentError(error);
      return data;
    },
    onSuccess: afterSuccess,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!secureSupabase || !isReady || !eventId) {
        throw new Error('Event scope is not ready');
      }
      if (deleteLoading) {
        throw new Error('Permission check in progress. Please wait…');
      }
      if (!canDelete) {
        throw new Error('Permission denied: You do not have permission to delete assignments.');
      }

      const { error } = await secureSupabase
        .from('trac_itinerary_assignment')
        .delete()
        .eq('id', id)
        .eq('event_id', eventId);

      if (error) throw mapAssignmentError(error);
    },
    onSuccess: afterSuccess,
  });

  const createAssignment = useCallback(
    (input: AssignmentWriteInput) => createMutation.mutateAsync(input),
    [createMutation]
  );

  const updateAssignmentNotes = useCallback(
    (id: string, notes: string | null) => updateMutation.mutateAsync({ id, notes }),
    [updateMutation]
  );

  const deleteAssignment = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  );

  return {
    createAssignment,
    updateAssignmentNotes,
    deleteAssignment,
    isSaving:
      createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    canCreate,
    canUpdate,
    canDelete,
  };
}
