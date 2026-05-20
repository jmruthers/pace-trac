export type CapacityPressure = 'ok' | 'near' | 'over';

/** Null capacity means uncapped (TR04 / TR03). */
export function isUncapped(capacity: number | null | undefined): boolean {
  return capacity == null;
}

export function getAssignedCount(assignments: readonly unknown[]): number {
  return assignments.length;
}

export function wouldExceedCapacity(
  assignedCount: number,
  capacity: number | null | undefined,
  adding = 1
): boolean {
  if (capacity == null) return false;
  return assignedCount + adding > capacity;
}

/** Pressure for badges: at/over capacity is `over`; within one seat of cap is `near`. */
export function getCapacityPressure(
  assignedCount: number,
  capacity: number | null | undefined
): CapacityPressure {
  if (capacity == null) return 'ok';
  if (assignedCount > capacity) return 'over';
  if (assignedCount >= capacity) return 'over';
  if (assignedCount >= capacity - 1 && capacity > 0) return 'near';
  return 'ok';
}

export function formatHeadcountLine(assignedCount: number, capacity: number | null | undefined): string {
  if (isUncapped(capacity)) {
    return `${assignedCount} assigned (uncapped)`;
  }
  return `${assignedCount} / ${capacity} assigned`;
}

export function requiresOverCapacityConfirmation(
  assignedCount: number,
  capacity: number | null | undefined,
  adding = 1
): boolean {
  return wouldExceedCapacity(assignedCount, capacity, adding);
}
