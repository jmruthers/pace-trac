import { z } from '@solvera/pace-core/utils';
import { RISK_CONSEQUENCE_VALUES } from '@/features/risks/enums/risk-consequence';
import { RISK_LIKELIHOOD_VALUES } from '@/features/risks/enums/risk-likelihood';
import { RISK_STATUS_VALUES } from '@/features/risks/enums/risk-status';
import { RISK_TYPE_VALUES } from '@/features/risks/enums/risk-type';
import { RISK_WHEN_VALUES } from '@/features/risks/enums/risk-when';
import type { RiskFormData } from '@/features/risks/types';

const optionalTrimmedText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .nullable()
  .transform((value) => (value === '' ? null : value ?? null));

export const riskFormSchema = z.object({
  type: z.enum(RISK_TYPE_VALUES, { message: 'Select a valid risk type' }),
  risk: z.string().trim().min(1, 'Risk description is required'),
  likelihood_before: z.enum(RISK_LIKELIHOOD_VALUES, { message: 'Select a valid likelihood (before)' }),
  consequence_before: z.enum(RISK_CONSEQUENCE_VALUES, {
    message: 'Select a valid consequence (before)',
  }),
  control: optionalTrimmedText,
  responsible_contact_id: optionalUuid,
  when: z.enum(RISK_WHEN_VALUES, { message: 'Select when the risk applies' }),
  status: z.enum(RISK_STATUS_VALUES, { message: 'Select a valid status' }),
  comment: optionalTrimmedText,
  likelihood_after: z.enum(RISK_LIKELIHOOD_VALUES, { message: 'Select a valid likelihood (after)' }),
  consequence_after: z.enum(RISK_CONSEQUENCE_VALUES, {
    message: 'Select a valid consequence (after)',
  }),
  response: optionalTrimmedText,
});

export type RiskFormInput = z.input<typeof riskFormSchema>;

export function parseRiskFormData(input: Partial<RiskFormInput>): RiskFormData {
  const result = riskFormSchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join('; ');
    throw new Error(message);
  }
  return result.data;
}
