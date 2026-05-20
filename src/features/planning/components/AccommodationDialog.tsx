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
import { buildAccommodationPayload } from '@/features/planning/build-payloads';
import { PlanningAttachmentsSection } from '@/features/planning/components/PlanningAttachmentsSection';
import { PlanningPlaceField } from '@/features/planning/components/PlanningPlaceField';
import { PlanningSharedFields } from '@/features/planning/components/PlanningFormFields';
import { rowToPlanningPlace } from '@/features/planning/location-snapshot';
import type { AccommodationRow, PlanningPlaceValue } from '@/features/planning/types';
import {
  accommodationFormSchema,
  type AccommodationFormValues,
} from '@/features/planning/validation';

interface AccommodationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accommodation?: AccommodationRow;
  onSave: (payload: ReturnType<typeof buildAccommodationPayload>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  mode: 'create' | 'edit';
}

function createAccommodationDefaultValues(): AccommodationFormValues {
  const now = Date.now();
  return {
    name: '',
    check_in_time: new Date(now),
    check_out_time: new Date(now + 86_400_000),
    location_label: '',
    status: 'idea',
    notes: '',
    booking_reference: '',
    currency: '',
    individual_cost: null,
    group_cost: null,
    capacity: null,
  };
}

function accommodationToFormValues(accommodation: AccommodationRow): AccommodationFormValues {
  return {
    name: accommodation.name,
    check_in_time: new Date(accommodation.check_in_time),
    check_out_time: new Date(accommodation.check_out_time),
    location_label: accommodation.location_display_name ?? '',
    status: accommodation.status ?? 'idea',
    notes: accommodation.notes ?? '',
    booking_reference: accommodation.booking_reference ?? '',
    currency: accommodation.currency ?? '',
    individual_cost: accommodation.individual_cost,
    group_cost: accommodation.group_cost,
    capacity: accommodation.capacity,
  };
}

function initialAccommodationLocation(
  accommodation: AccommodationRow | undefined
): PlanningPlaceValue | null {
  if (accommodation == null) return null;
  return rowToPlanningPlace(
    accommodation.location_place_id,
    accommodation.location_display_name,
    accommodation.location_short_address,
    accommodation.location_coords,
    accommodation.location_timezone
  );
}

interface AccommodationDialogFormProps {
  mode: 'create' | 'edit';
  accommodation?: AccommodationRow;
  canSave: boolean;
  canDelete: boolean;
  onSave: AccommodationDialogProps['onSave'];
  onDelete?: AccommodationDialogProps['onDelete'];
  onClose: () => void;
}

function AccommodationDialogForm({
  mode,
  accommodation,
  canSave,
  canDelete,
  onSave,
  onDelete,
  onClose,
}: AccommodationDialogFormProps) {
  const [formDefaults] = useState(() =>
    mode === 'create' || accommodation == null
      ? createAccommodationDefaultValues()
      : accommodationToFormValues(accommodation)
  );
  const [location, setLocation] = useState<PlanningPlaceValue | null>(
    initialAccommodationLocation(accommodation)
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <Form
      schema={accommodationFormSchema}
      defaultValues={formDefaults}
            onSubmit={async (values) => {
              setSubmitError(null);
              if (!location?.displayName) {
                setSubmitError('Location is required.');
                return;
              }
              const payload = buildAccommodationPayload(
                { ...values, location_label: location.displayName },
                location
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
                  Check-in
                  <DateTimeField
                    value={methods.watch('check_in_time')}
                    onChange={(date) => methods.setValue('check_in_time', date)}
                  />
                </Label>
                <Label>
                  Check-out
                  <DateTimeField
                    value={methods.watch('check_out_time')}
                    onChange={(date) => methods.setValue('check_out_time', date)}
                  />
                </Label>
                <PlanningPlaceField
                  label="Location"
                  value={location}
                  onChange={setLocation}
                  required
                />
                <PlanningSharedFields
                  status={methods.watch('status')}
                  onStatusChange={(value) =>
                    methods.setValue('status', value as AccommodationFormValues['status'])
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
                  tableName="trac_accommodation"
                  recordId={accommodation?.id ?? null}
                  canWrite={canSave}
                />
                <DialogFooter>
                  {mode === 'edit' && accommodation?.id && onDelete && canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        await onDelete(accommodation.id);
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

export function AccommodationDialog({
  open,
  onOpenChange,
  accommodation,
  onSave,
  onDelete,
  mode,
}: AccommodationDialogProps) {
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
    mode === 'create' ? `create-${openGeneration}` : `edit-${accommodation?.id ?? 'none'}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add accommodation' : 'Edit accommodation'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {open ? (
            <AccommodationDialogForm
              key={formSessionKey}
              mode={mode}
              accommodation={accommodation}
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
