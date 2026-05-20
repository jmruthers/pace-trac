import { useState } from 'react';
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

const defaultValues: ActivityFormValues = {
  name: '',
  start_time: new Date(),
  finish_time: new Date(Date.now() + 3600000),
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

  const [startLocation, setStartLocation] = useState<PlanningPlaceValue | null>(() =>
    activity
      ? rowToPlanningPlace(
          activity.start_location_place_id,
          activity.start_location_display_name,
          activity.start_location_short_address,
          activity.start_location_coords,
          activity.start_location_timezone
        )
      : null
  );
  const [finishLocation, setFinishLocation] = useState<PlanningPlaceValue | null>(() =>
    activity
      ? rowToPlanningPlace(
          activity.finish_location_place_id,
          activity.finish_location_display_name,
          activity.finish_location_short_address,
          activity.finish_location_coords,
          activity.finish_location_timezone
        )
      : null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialValues: ActivityFormValues = activity
    ? {
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
      }
    : defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add activity' : 'Edit activity'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Form
            schema={activityFormSchema}
            defaultValues={initialValues}
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
                onOpenChange(false);
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
                        onOpenChange(false);
                      }}
                    >
                      Delete
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!canSave}>
                    Save
                  </Button>
                </DialogFooter>
              </section>
            )}
          </Form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
