import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@solvera/pace-core/components';
import { formatHeadcountLine, requiresOverCapacityConfirmation } from '@/features/assignments/headcount';
import { useApprovedApplications } from '@/features/assignments/hooks/useApprovedApplications';
import { useAssignmentMutations } from '@/features/assignments/hooks/useAssignmentMutations';
import { formatParticipantLabel } from '@/features/assignments/participant-label';
import type { AssignmentWithParticipant, TracResourceType } from '@/features/assignments/types';
import type { ResourceSummary } from '@/features/assignments/types';

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  resourceType: TracResourceType;
  resource: ResourceSummary;
  assignment?: AssignmentWithParticipant;
  assignedCount: number;
  assignedApplicationIds: Set<string>;
  onSaved: () => void;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  mode,
  resourceType,
  resource,
  assignment,
  assignedCount,
  assignedApplicationIds,
  onSaved,
}: AssignmentDialogProps) {
  const { applications, isLoading: appsLoading } = useApprovedApplications();
  const { createAssignment, updateAssignmentNotes, deleteAssignment, isSaving, canCreate, canUpdate, canDelete } =
    useAssignmentMutations();

  const [applicationId, setApplicationId] = useState(
    () => (mode === 'edit' && assignment ? assignment.application_id : '')
  );
  const [notes, setNotes] = useState(() => (mode === 'edit' && assignment ? assignment.notes ?? '' : ''));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOverCapacityStep, setShowOverCapacityStep] = useState(false);

  const handleDialogOpenChange = (next: boolean) => {
    if (next) {
      setErrorMessage(null);
      setShowOverCapacityStep(false);
      if (mode === 'edit' && assignment) {
        setApplicationId(assignment.application_id);
        setNotes(assignment.notes ?? '');
      } else {
        setApplicationId('');
        setNotes('');
      }
    }
    onOpenChange(next);
  };

  const availableApplications = applications.filter(
    (app) => mode === 'edit' || !assignedApplicationIds.has(app.id)
  );

  const needsOverCapacityConfirm =
    mode === 'create' &&
    requiresOverCapacityConfirmation(assignedCount, resource.capacity, 1);

  const handlePrimarySave = async () => {
    setErrorMessage(null);

    if (mode === 'create') {
      if (!canCreate) {
        setErrorMessage('You do not have permission to create assignments.');
        return;
      }
      if (!applicationId) {
        setErrorMessage('Select an approved participant.');
        return;
      }
      if (needsOverCapacityConfirm && !showOverCapacityStep) {
        setShowOverCapacityStep(true);
        return;
      }
      try {
        await createAssignment({
          application_id: applicationId,
          resource_type: resourceType,
          resource_id: resource.id,
          notes: notes.trim() === '' ? null : notes.trim(),
        });
        onSaved();
        onOpenChange(false);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to save assignment');
      }
      return;
    }

    if (!canUpdate || !assignment) {
      setErrorMessage('You do not have permission to update assignments.');
      return;
    }

    try {
      await updateAssignmentNotes(assignment.id, notes.trim() === '' ? null : notes.trim());
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update assignment');
    }
  };

  const handleDelete = async () => {
    if (!assignment || !canDelete) return;
    setErrorMessage(null);
    try {
      await deleteAssignment(assignment.id);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete assignment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogPortal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Add assignment' : 'Edit assignment'}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p>{resource.label}</p>
            <p>{formatHeadcountLine(assignedCount, resource.capacity)}</p>

            {showOverCapacityStep ? (
              <Alert variant="destructive">
                <strong>Over capacity.</strong> This save will exceed the resource capacity (
                {assignedCount + 1} / {resource.capacity}). Confirm only if you intend to proceed.
              </Alert>
            ) : null}

            {errorMessage ? <Alert variant="destructive">{errorMessage}</Alert> : null}

            {mode === 'create' ? (
              <Label>
                Participant (approved applications only)
                {appsLoading ? (
                  <p>Loading participants…</p>
                ) : (
                  <Select
                    value={applicationId}
                    onValueChange={(value) => setApplicationId(value ?? '')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select participant" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableApplications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {formatParticipantLabel(app)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Label>
            ) : (
              <p>Participant: {assignment?.participantLabel}</p>
            )}

            <Label>
              Notes
              <Input
                type="text"
                value={notes}
                onChange={(value) => setNotes(value)}
                placeholder="Optional assignment notes"
              />
            </Label>
          </DialogBody>
          <DialogFooter>
            {mode === 'edit' && canDelete ? (
              <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={isSaving}>
                Delete
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handlePrimarySave()}
              disabled={
                isSaving || (mode === 'create' && !canCreate) || (mode === 'edit' && !canUpdate)
              }
            >
              {showOverCapacityStep ? 'Confirm save' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
