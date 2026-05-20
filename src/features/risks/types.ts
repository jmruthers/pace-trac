import type { RiskConsequence } from '@/features/risks/enums/risk-consequence';
import type { RiskLikelihood } from '@/features/risks/enums/risk-likelihood';
import type { RiskStatus } from '@/features/risks/enums/risk-status';
import type { RiskType } from '@/features/risks/enums/risk-type';
import type { RiskWhen } from '@/features/risks/enums/risk-when';

/** Row shape for `public.trac_risks` (dev-db). */
export interface Risk extends Record<string, unknown> {
  id: string;
  event_id: string;
  organisation_id: string;
  type: RiskType;
  risk: string;
  likelihood_before: RiskLikelihood;
  consequence_before: RiskConsequence;
  control: string | null;
  responsible_contact_id: string | null;
  when: RiskWhen;
  status: RiskStatus;
  comment: string | null;
  likelihood_after: RiskLikelihood;
  consequence_after: RiskConsequence;
  response: string | null;
  impact_before: number | null;
  impact_after: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/** Writable risk fields (excludes generated impacts and audit/scope ids). */
export interface RiskFormData {
  type: RiskType;
  risk: string;
  likelihood_before: RiskLikelihood;
  consequence_before: RiskConsequence;
  control?: string;
  responsible_contact_id?: string | null;
  when: RiskWhen;
  status: RiskStatus;
  comment?: string;
  likelihood_after: RiskLikelihood;
  consequence_after: RiskConsequence;
  response?: string;
}
