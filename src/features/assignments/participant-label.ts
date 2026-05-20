import type { ApprovedApplication } from '@/features/assignments/types';

/** Display label for approved application picker rows (minimal PII). */
export function formatParticipantLabel(app: ApprovedApplication): string {
  const first = app.first_name?.trim() ?? '';
  const last = app.surname?.trim() ?? '';
  const combined = `${first} ${last}`.trim();
  if (combined !== '') return combined;
  return `Application ${app.id.slice(0, 8)}`;
}
