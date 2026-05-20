import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { planningQueryKeys } from '@/features/planning/query-keys';
import { invalidatePlanningAndDependents } from '@/features/planning/invalidation';
import { usePlanningScope } from '@/features/planning/hooks/usePlanningScope';
import { asPlanningClient } from '@/features/planning/supabase-helpers';
import type { LogisticsTableName, PlanningAttachment } from '@/features/planning/types';

function mapAttachmentRow(row: Record<string, unknown>): PlanningAttachment {
  const metadata =
    row.file_metadata != null && typeof row.file_metadata === 'object'
      ? (row.file_metadata as Record<string, unknown>)
      : {};
  return {
    id: String(row.id ?? ''),
    record_id: String(row.record_id ?? ''),
    table_name: String(row.table_name ?? '') as LogisticsTableName,
    file_path: String(row.file_path ?? ''),
    file_name: typeof metadata.fileName === 'string' ? metadata.fileName : null,
    file_type: typeof metadata.fileType === 'string' ? metadata.fileType : null,
    file_size: typeof metadata.fileSize === 'number' ? metadata.fileSize : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : null,
  };
}

export function usePlanningAttachments(tableName: LogisticsTableName, recordId: string | null) {
  const secureSupabase = asPlanningClient(useSecureSupabase());
  const queryClient = useQueryClient();
  const { eventId, organisationId, appId, isReady } = usePlanningScope();

  const listQuery = useQuery({
    queryKey: planningQueryKeys.attachments(tableName, recordId ?? ''),
    enabled: Boolean(secureSupabase && isReady && recordId),
    queryFn: async (): Promise<PlanningAttachment[]> => {
      if (!secureSupabase || !recordId) return [];
      const builder = secureSupabase.from('core_file_references').select('*');
      const filtered = builder.eq('record_id', recordId).eq('table_name', tableName);
      const { data, error } = await filtered.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapAttachmentRow(row));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!secureSupabase || !recordId || !organisationId || !appId) {
        throw new Error('Cannot upload: scope or record is not ready');
      }
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${organisationId}/${tableName}/${fileName}`;
      const { error: uploadError } = await secureSupabase.storage
        .from('files')
        .upload(filePath, file);
      if (uploadError) throw new Error(uploadError.message);

      const insertResult = secureSupabase.from('core_file_references').insert({
        record_id: recordId,
        table_name: tableName,
        file_path: filePath,
        app_id: appId,
        is_public: false,
        file_metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      });
      const { data: fileRef, error: dbError } = await insertResult.select('*').single();

      if (dbError) {
        await secureSupabase.storage.from('files').remove([filePath]);
        throw new Error(dbError.message);
      }
      return mapAttachmentRow(fileRef ?? {});
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: planningQueryKeys.attachments(tableName, recordId ?? ''),
      });
      if (eventId) {
        await invalidatePlanningAndDependents(queryClient, eventId);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachment: PlanningAttachment) => {
      if (!secureSupabase) throw new Error('Secure client unavailable');
      if (attachment.file_path) {
        const { error: storageError } = await secureSupabase.storage
          .from('files')
          .remove([attachment.file_path]);
        if (storageError) throw new Error(storageError.message);
      }
      const { error } = await secureSupabase
        .from('core_file_references')
        .delete()
        .eq('id', attachment.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: planningQueryKeys.attachments(tableName, recordId ?? ''),
      });
      if (eventId) {
        await invalidatePlanningAndDependents(queryClient, eventId);
      }
    },
  });

  const uploadFile = useCallback(
    async (file: File) => uploadMutation.mutateAsync(file),
    [uploadMutation]
  );

  const removeAttachment = useCallback(
    async (attachment: PlanningAttachment) => deleteMutation.mutateAsync(attachment),
    [deleteMutation]
  );

  return {
    attachments: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    refetch: listQuery.refetch,
    uploadFile,
    removeAttachment,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    deleteError: deleteMutation.error,
  };
}
