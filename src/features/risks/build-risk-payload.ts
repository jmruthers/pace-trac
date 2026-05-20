import type { RiskFormData } from '@/features/risks/types';

const GENERATED_OR_AUDIT_KEYS = new Set([
  'impact_before',
  'impact_after',
  'id',
  'event_id',
  'organisation_id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
]);

/** Maps form data to an insert/update row; never includes generated impact columns. */
export function toRiskWritePayload(form: RiskFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    type: form.type,
    risk: form.risk,
    likelihood_before: form.likelihood_before,
    consequence_before: form.consequence_before,
    control: form.control?.trim() || null,
    responsible_contact_id: form.responsible_contact_id ?? null,
    when: form.when,
    status: form.status,
    comment: form.comment?.trim() || null,
    likelihood_after: form.likelihood_after,
    consequence_after: form.consequence_after,
    response: form.response?.trim() || null,
  };

  for (const key of Object.keys(payload)) {
    if (GENERATED_OR_AUDIT_KEYS.has(key)) {
      delete payload[key];
    }
  }

  return payload;
}

export function assertNoGeneratedImpactKeys(payload: Record<string, unknown>): void {
  for (const key of GENERATED_OR_AUDIT_KEYS) {
    if (key in payload && (key === 'impact_before' || key === 'impact_after')) {
      throw new Error(`Write payload must not include generated field: ${key}`);
    }
  }
}
