import {
  Alert,
  Button,
  FileUpload,
  LoadingSpinner,
} from '@solvera/pace-core/components';
import { useSecureSupabase } from '@solvera/pace-core/rbac';
import { usePlanningAttachments } from '@/features/planning/hooks/usePlanningAttachments';
import { usePlanningScope } from '@/features/planning/hooks/usePlanningScope';
import type { LogisticsTableName } from '@/features/planning/types';

interface PlanningAttachmentsSectionProps {
  tableName: LogisticsTableName;
  recordId: string | null;
  canWrite: boolean;
}

export function PlanningAttachmentsSection({
  tableName,
  recordId,
  canWrite,
}: PlanningAttachmentsSectionProps) {
  const secureSupabase = useSecureSupabase();
  const { eventId, organisationId, appId } = usePlanningScope();
  const {
    attachments,
    isLoading,
    removeAttachment,
    uploadError,
    deleteError,
    refetch,
  } = usePlanningAttachments(tableName, recordId);

  if (recordId == null) {
    return <p>Save this item before adding supporting documents.</p>;
  }

  return (
    <section>
      <h3>Supporting documents</h3>
      {isLoading ? <LoadingSpinner /> : null}
      {uploadError ? (
        <Alert variant="destructive">
          Upload failed: {uploadError instanceof Error ? uploadError.message : 'Unknown error'}
        </Alert>
      ) : null}
      {deleteError ? (
        <Alert variant="destructive">
          Delete failed: {deleteError instanceof Error ? deleteError.message : 'Unknown error'}
        </Alert>
      ) : null}
      {canWrite && secureSupabase && organisationId && eventId && appId ? (
        <FileUpload
          supabase={secureSupabase as never}
          table_name={tableName}
          record_id={recordId}
          organisation_id={organisationId}
          event_id={eventId}
          app_id={appId}
          bucket="files"
          category="planning"
          folder={tableName}
          label="Upload document"
          onUploadSuccess={() => void refetch()}
        />
      ) : null}
      {attachments.length === 0 ? <p>No supporting documents yet.</p> : null}
      <ul>
        {attachments.map((attachment) => (
          <li key={attachment.id}>
            <p>{attachment.file_name ?? attachment.file_path}</p>
            {canWrite ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void removeAttachment(attachment)}
              >
                Delete
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
