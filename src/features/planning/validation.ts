import { z } from '@solvera/pace-core/utils';
import { TRAC_STATUS_VALUES, TRANSPORT_MODE_VALUES } from '@/features/planning/enums';

const capacitySchema = z
  .union([z.literal(''), z.null(), z.undefined(), z.coerce.number()])
  .transform((value) => {
    if (value === '' || value == null) return null;
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return null;
    return num;
  })
  .refine((value) => value == null || (Number.isInteger(value) && value > 0), {
    message: 'Capacity must be a positive whole number when set',
  });

const optionalCostSchema = z
  .union([z.literal(''), z.null(), z.undefined(), z.coerce.number()])
  .transform((value) => {
    if (value === '' || value == null) return null;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
  });

export const tracStatusSchema = z.enum(TRAC_STATUS_VALUES, {
  message: 'Select a valid status',
});

export const transportModeSchema = z.enum(TRANSPORT_MODE_VALUES, {
  message: 'Select a valid transport mode',
});

const baseLogisticsSchema = z.object({
  status: tracStatusSchema.default('idea'),
  notes: z.string().optional(),
  booking_reference: z.string().optional(),
  currency: z.string().max(3).optional(),
  individual_cost: optionalCostSchema,
  group_cost: optionalCostSchema,
  capacity: capacitySchema,
});

export const transportFormSchema = baseLogisticsSchema
  .extend({
    mode: transportModeSchema,
    transport_number: z.string().optional(),
    departure_time: z.coerce.date({ message: 'Departure time is required' }),
    arrival_time: z.coerce.date({ message: 'Arrival time is required' }),
    departure_label: z.string().min(1, 'Departure location is required'),
    arrival_label: z.string().min(1, 'Arrival location is required'),
  })
  .refine((data) => data.arrival_time > data.departure_time, {
    message: 'Arrival time must be after departure time',
    path: ['arrival_time'],
  });

export const accommodationFormSchema = baseLogisticsSchema
  .extend({
    name: z.string().min(1, 'Name is required'),
    check_in_time: z.coerce.date({ message: 'Check-in time is required' }),
    check_out_time: z.coerce.date({ message: 'Check-out time is required' }),
    location_label: z.string().min(1, 'Location is required'),
  })
  .refine((data) => data.check_out_time > data.check_in_time, {
    message: 'Check-out must be after check-in',
    path: ['check_out_time'],
  });

export const activityFormSchema = baseLogisticsSchema
  .extend({
    name: z.string().min(1, 'Name is required'),
    start_time: z.coerce.date({ message: 'Start time is required' }),
    finish_time: z.coerce.date({ message: 'Finish time is required' }),
    start_location_label: z.string().min(1, 'Start location is required'),
    finish_location_label: z.string().min(1, 'Finish location is required'),
  })
  .refine((data) => data.finish_time > data.start_time, {
    message: 'Finish time must be after start time',
    path: ['finish_time'],
  });

export type TransportFormValues = z.infer<typeof transportFormSchema>;
export type AccommodationFormValues = z.infer<typeof accommodationFormSchema>;
export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export function validateTracStatusForSubmit(value: unknown): {
  ok: boolean;
  message?: string;
} {
  const parsed = tracStatusSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid status' };
  }
  return { ok: true };
}

export function validateCapacityForSubmit(value: unknown): { ok: boolean; message?: string } {
  const parsed = capacitySchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid capacity' };
  }
  return { ok: true };
}
