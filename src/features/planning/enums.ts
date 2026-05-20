/** DB enum `trac_status` — must match dev-db / generated types. */
export const TRAC_STATUS_VALUES = [
  'idea',
  'planned',
  'booked',
  'confirmed',
  'dropped',
  'cancelled',
] as const;

export type TracStatus = (typeof TRAC_STATUS_VALUES)[number];

export const TRAC_STATUS_LABELS: Record<TracStatus, string> = {
  idea: 'Idea',
  planned: 'Planned',
  booked: 'Booked',
  confirmed: 'Confirmed',
  dropped: 'Dropped',
  cancelled: 'Cancelled',
};

/** DB enum `transport_mode`. */
export const TRANSPORT_MODE_VALUES = [
  'Flight',
  'Bus',
  'Coach',
  'Train',
  'Car',
  'Ferry',
  'Shuttle',
  'Walk',
] as const;

export type TransportMode = (typeof TRANSPORT_MODE_VALUES)[number];

export function isTracStatus(value: unknown): value is TracStatus {
  return typeof value === 'string' && (TRAC_STATUS_VALUES as readonly string[]).includes(value);
}

export function isTransportMode(value: unknown): value is TransportMode {
  return typeof value === 'string' && (TRANSPORT_MODE_VALUES as readonly string[]).includes(value);
}

export function normalizeTransportMode(value: string): TransportMode | null {
  const match = TRANSPORT_MODE_VALUES.find(
    (mode) => mode.toLowerCase() === value.trim().toLowerCase()
  );
  return match ?? null;
}
