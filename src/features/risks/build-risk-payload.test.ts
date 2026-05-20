import { describe, it, expect } from 'vitest';
import { assertNoGeneratedImpactKeys, toRiskWritePayload } from '@/features/risks/build-risk-payload';
import type { RiskFormData } from '@/features/risks/types';

const sampleForm: RiskFormData = {
  type: 'Transport',
  risk: 'Flight cancellation',
  likelihood_before: 'Likely',
  consequence_before: 'Major',
  when: 'During',
  status: 'Planned',
  likelihood_after: 'Possible',
  consequence_after: 'Significant',
  control: 'Backup routing',
  responsible_contact_id: 'contact-uuid',
  comment: 'Monitor airline alerts',
  response: 'Rebook on alternate carrier',
};

describe('toRiskWritePayload', () => {
  it('maps writable fields and omits generated impacts', () => {
    const payload = toRiskWritePayload(sampleForm);
    expect(payload).toMatchObject({
      type: 'Transport',
      risk: 'Flight cancellation',
      likelihood_before: 'Likely',
      consequence_before: 'Major',
      likelihood_after: 'Possible',
      consequence_after: 'Significant',
    });
    expect(payload).not.toHaveProperty('impact_before');
    expect(payload).not.toHaveProperty('impact_after');
    expect(payload).not.toHaveProperty('id');
    assertNoGeneratedImpactKeys(payload);
  });

  it('normalizes optional text to null when empty', () => {
    const payload = toRiskWritePayload({
      ...sampleForm,
      control: '',
      comment: '  ',
      response: undefined,
    });
    expect(payload.control).toBeNull();
    expect(payload.comment).toBeNull();
    expect(payload.response).toBeNull();
  });
});
