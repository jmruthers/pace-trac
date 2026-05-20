import { useCallback, useState } from 'react';
import {
  Alert,
  Button,
  DateTimeField,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  Input,
  Label,
} from '@solvera/pace-core/components';
import { usePageCan } from '@solvera/pace-core/rbac';
import { buildActivityPayload } from '@/features/planning/build-payloads';
import { PlanningAttachmentsSection } from '@/features/planning/components/PlanningAttachmentsSection';
import { PlanningPlaceField } from '@/features/planning/components/PlanningPlaceField';
import { PlanningSharedFields } from '@/features/planning/components/PlanningFormFields';
import { rowToPlanningPlace } from '@/features/planning/location-snapshot';
import type { ActivityRow, PlanningPlaceValue } from '@/features/planning/types';
import { activityFormSchema, type ActivityFormValues } from '@/features/planning/validation';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: ActivityRow;
  onSave: (payload: ReturnType<typeof buildActivityPayload>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  mode: 'create' | 'edit';
}

function createActivityDefaultValues(): ActivityFormValues {
  const now = Date.now();
  return {
    name: '',
    start_time: new Date(now),
    finish_time: new Date(now + 3_600_000),
    start_location_label: '',
    finish_location_label: '',
    status: 'idea',
    notes: '',
    booking_reference: '',
    currency: '',
    individual_cost: null,
    group_cost: null,
    capacity: null,
  };
}

function activityToFormValues(activity: ActivityRow): ActivityFormValues {
  return {
    name: activity.name,
    start_time: new Date(activity.start_time),
    finish_time: new Date(activity.finish_time),
    start_location_label: activity.start_location_display_name ?? '',
    finish_location_label: activity.finish_location_display_name ?? '',
    status: activity.status ?? 'idea',
    notes: activity.notes ?? '',
    booking_reference: activity.booking_reference ?? '',
    currency: activity.currency ?? '',
    individual_cost: activity.individual_cost,
    group_cost: activity.group_cost,
    capacity: activity.capacity,
  };
}

function initialActivityPlaces(activity: ActivityRow | undefined): {
  startLocation: PlanningPlaceValue | null;
  finishLocation: PlanningPlaceValue | null;
} {
  if (activity == null) {
    return { startLocation: null, finishLocation: null };
  }
  return {
    startLocation: rowToPlanningPlace(
      activity.start_location_place_id,
      activity.start_location_display_name,
      activity.start_location_short_address,
      activity.start_location_coords,
      activity.start_location_timezone
    ),
    finishLocation: rowToPlanningPlace(
      activity.finish_location_place_id,
      activity.finish_location_display_name,
      activity.finish_location_short_address,
      activity.finish_location_coords,
      activity.finish_location_timezone
    ),
  };
}

interface ActivityDialogFormProps {
  mode: 'create' | 'edit';
  activity?: ActivityRow;
  canSave: boolean;
  canDelete: boolean;
  onSave: ActivityDialogProps['onSave'];
  onDelete?: ActivityDialogProps['onDelete'];
  onClose: () => void;
}

function ActivityDialogForm({
  mode,
  activity,
  canSave,
  canDelete,
  onSave,
  onDelete,
  onClose,
}: ActivityDialogFormProps) {
  const initialPlaces = initialActivityPlaces(activity);
  const [formDefaults] = useState(() =>
    mode === 'create' || activity == null
      ? createActivityDefaultValues()
      : activityToFormValues(activity)
  );
  const [startLocation, setStartLocation] = useState<PlanningPlaceValue | null>(
    initialPlaces.startLocation
  );
  const [finishLocation, setFinishLocation] = useState<PlanningPlaceValue | null>(
    initialPlaces.finishLocation
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <Form
      schema={activityFormSchema}
      defaultValues={formDefaults}
            onSubmit={async (values) => {
              setSubmitError(null);
              if (!startLocation?.displayName || !finishLocation?.displayName) {
                setSubmitError('Start and finish locations are required.');
                return;
              }
              const payload = buildActivityPayload(
                {
                  ...values,
                  start_location_label: startLocation.displayName,
                  finish_location_label: finishLocation.displayName,
                },
                startLocation,
                finishLocation
              );
              try {
                await onSave(payload);
                onClose();
              } catch (error) {
                setSubmitError(error instanceof Error ? error.message : 'Save failed');
              }
            }}
          >
            {(methods) => (
              <section className="grid gap-4">
                {submitError ? <Alert variant="destructive">{submitError}</Alert> : null}
                <Label>
                  Name
                  <Input
                    value={methods.watch('name')}
                    onChange={(value) => methods.setValue('name', value)}
                  />
                </Label>
                <Label>
                  Start time
                  <DateTimeField
                    value={methods.watch('start_time')}
                    onChange={(date) => methods.setValue('start_time', date)}
                  />
                </Label>
                <Label>
                  Finish time
                  <DateTimeField
                    value={methods.watch('finish_time')}
                    onChange={(date) => methods.setValue('finish_time', date)}
                  />
                </Label>
                <PlanningPlaceField
                  label="Start location"
                  value={startLocation}
                  onChange={setStartLocation}
                  required
                />
                <PlanningPlaceField
                  label="Finish location"
                  value={finishLocation}
                  onChange={setFinishLocation}
                  required
                />
                <PlanningSharedFields
                  status={methods.watch('status')}
                  onStatusChange={(value) =>
                    methods.setValue('status', value as ActivityFormValues['status'])
                  }
                  capacity={methods.watch('capacity')}
                  onCapacityChange={(value) => methods.setValue('capacity', value)}
                  notes={methods.watch('notes') ?? ''}
                  onNotesChange={(value) => methods.setValue('notes', value)}
                  bookingReference={methods.watch('booking_reference') ?? ''}
                  onBookingReferenceChange={(value) => methods.setValue('booking_reference', value)}
                  currency={methods.watch('currency') ?? ''}
                  onCurrencyChange={(value) => methods.setValue('currency', value)}
                  primaryCost={methods.watch('individual_cost')}
                  onPrimaryCostChange={(value) => methods.setValue('individual_cost', value)}
                  secondaryCost={methods.watch('group_cost')}
                  onSecondaryCostChange={(value) => methods.setValue('group_cost', value)}
                  primaryCostLabel="Individual cost"
                  secondaryCostLabel="Also track group cost"
                />
                <PlanningAttachmentsSection
                  tableName="trac_activity"
                  recordId={activity?.id ?? null}
                  canWrite={canSave}
                />
                <DialogFooter>
                  {mode === 'edit' && activity?.id && onDelete && canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        await onDelete(activity.id);
                        onClose();
                      }}
                    >
                      Delete
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSave}>
                    Save
                  </Button>
                </DialogFooter>
              </section>
            )}
          </Form>
  );
}

export function ActivityDialog({
  open,
  onOpenChange,
  activity,
  onSave,
  onDelete,
  mode,
}: ActivityDialogProps) {
  const { can: canCreate } = usePageCan('planning', 'create');
  const { can: canUpdate } = usePageCan('planning', 'update');
  const { can: canDelete } = usePageCan('planning', 'delete');
  const canSave = mode === 'create' ? canCreate : canUpdate;

  const [openGeneration, setOpenGeneration] = useState(0);
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setOpenGeneration((generation) => generation + 1);
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const formSessionKey =
    mode === 'create' ? `create-${openGeneration}` : `edit-${activity?.id ?? 'none'}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add activity' : 'Edit activity'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {open ? (
            <ActivityDialogForm
              key={formSessionKey}
              mode={mode}
              activity={activity}
              canSave={canSave}
              canDelete={canDelete}
              onSave={onSave}
              onDelete={onDelete}
              onClose={() => handleOpenChange(false)}
            />
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
