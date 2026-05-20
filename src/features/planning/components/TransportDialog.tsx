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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@solvera/pace-core/components';
import { usePageCan } from '@solvera/pace-core/rbac';
import { buildTransportPayload } from '@/features/planning/build-payloads';
import { PlanningAttachmentsSection } from '@/features/planning/components/PlanningAttachmentsSection';
import { PlanningPlaceField } from '@/features/planning/components/PlanningPlaceField';
import { PlanningSharedFields } from '@/features/planning/components/PlanningFormFields';
import { TRANSPORT_MODE_VALUES } from '@/features/planning/enums';
import { rowToPlanningPlace } from '@/features/planning/location-snapshot';
import type { PlanningPlaceValue, TransportRow } from '@/features/planning/types';
import {
  transportFormSchema,
  type TransportFormValues,
} from '@/features/planning/validation';

interface TransportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transport?: TransportRow;
  onSave: (payload: ReturnType<typeof buildTransportPayload>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  mode: 'create' | 'edit';
}

const defaultValues: TransportFormValues = {
  mode: 'Flight',
  transport_number: '',
  departure_time: new Date(),
  arrival_time: new Date(Date.now() + 3600000),
  departure_label: '',
  arrival_label: '',
  status: 'idea',
  notes: '',
  booking_reference: '',
  currency: '',
  individual_cost: null,
  group_cost: null,
  capacity: null,
};

export function TransportDialog({
  open,
  onOpenChange,
  transport,
  onSave,
  onDelete,
  mode,
}: TransportDialogProps) {
  const { can: canCreate } = usePageCan('planning', 'create');
  const { can: canUpdate } = usePageCan('planning', 'update');
  const { can: canDelete } = usePageCan('planning', 'delete');
  const canSave = mode === 'create' ? canCreate : canUpdate;

  const [departure, setDeparture] = useState<PlanningPlaceValue | null>(() =>
    transport
      ? rowToPlanningPlace(
          transport.departure_place_id,
          transport.departure_display_name,
          transport.departure_short_address,
          transport.departure_coords,
          transport.departure_timezone
        )
      : null
  );
  const [arrival, setArrival] = useState<PlanningPlaceValue | null>(() =>
    transport
      ? rowToPlanningPlace(
          transport.arrival_place_id,
          transport.arrival_display_name,
          transport.arrival_short_address,
          transport.arrival_coords,
          transport.arrival_timezone
        )
      : null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initialValues: TransportFormValues = transport
    ? {
        mode: transport.mode,
        transport_number: transport.transport_number ?? '',
        departure_time: new Date(transport.departure_time),
        arrival_time: new Date(transport.arrival_time),
        departure_label: transport.departure_display_name ?? '',
        arrival_label: transport.arrival_display_name ?? '',
        status: transport.status ?? 'idea',
        notes: transport.notes ?? '',
        booking_reference: transport.booking_reference ?? '',
        currency: transport.currency ?? '',
        individual_cost: transport.individual_cost,
        group_cost: transport.group_cost,
        capacity: transport.capacity,
      }
    : defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add transport' : 'Edit transport'}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Form
            schema={transportFormSchema}
            defaultValues={initialValues}
            onSubmit={async (values) => {
              setSubmitError(null);
              if (!departure?.displayName || !arrival?.displayName) {
                setSubmitError('Departure and arrival locations are required.');
                return;
              }
              const payload = buildTransportPayload(
                {
                  ...values,
                  departure_label: departure.displayName,
                  arrival_label: arrival.displayName,
                },
                departure,
                arrival
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
                  Mode
                  <Select
                    value={methods.watch('mode')}
                    onValueChange={(value) =>
                      methods.setValue('mode', value as TransportFormValues['mode'])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSPORT_MODE_VALUES.map((modeValue) => (
                        <SelectItem key={modeValue} value={modeValue}>
                          {modeValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Label>
                <Label>
                  Transport number
                  <Input
                    value={methods.watch('transport_number') ?? ''}
                    onChange={(value) => methods.setValue('transport_number', value)}
                  />
                </Label>
                <Label>
                  Departure time
                  <DateTimeField
                    value={methods.watch('departure_time')}
                    onChange={(date) => methods.setValue('departure_time', date)}
                  />
                </Label>
                <Label>
                  Arrival time
                  <DateTimeField
                    value={methods.watch('arrival_time')}
                    onChange={(date) => methods.setValue('arrival_time', date)}
                  />
                </Label>
                <PlanningPlaceField
                  label="Departure"
                  value={departure}
                  onChange={setDeparture}
                  required
                />
                <PlanningPlaceField label="Arrival" value={arrival} onChange={setArrival} required />
                <PlanningSharedFields
                  status={methods.watch('status')}
                  onStatusChange={(value) =>
                    methods.setValue('status', value as TransportFormValues['status'])
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
                  tableName="trac_transport"
                  recordId={transport?.id ?? null}
                  canWrite={canSave}
                />
                <DialogFooter>
                  {mode === 'edit' && transport?.id && onDelete && canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        await onDelete(transport.id);
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
