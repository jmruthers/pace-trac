import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  Form,
  FormField,
  SaveActions,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@solvera/pace-core/components';
import { usePageCan } from '@solvera/pace-core/rbac';
import { ResponsibleContactSelect } from '@/features/contacts/components/ResponsibleContactSelect';
import { RiskImpactDisplay } from '@/features/risks/components/RiskImpactDisplay';
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_CONSEQUENCE_VALUES,
} from '@/features/risks/enums/risk-consequence';
import {
  RISK_LIKELIHOOD_LABELS,
  RISK_LIKELIHOOD_VALUES,
} from '@/features/risks/enums/risk-likelihood';
import { RISK_STATUS_LABELS, RISK_STATUS_VALUES } from '@/features/risks/enums/risk-status';
import { RISK_TYPE_LABELS, RISK_TYPE_VALUES } from '@/features/risks/enums/risk-type';
import { RISK_WHEN_LABELS, RISK_WHEN_VALUES } from '@/features/risks/enums/risk-when';
import { riskFormSchema } from '@/features/risks/risk-schema';
import type { Risk, RiskFormData } from '@/features/risks/types';

export interface RiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk?: Risk | null;
  onSave: (formData: RiskFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  mode: 'create' | 'edit';
  isSubmitting?: boolean;
}

const defaultForm: RiskFormData = {
  type: 'Operational',
  risk: '',
  likelihood_before: 'Possible',
  consequence_before: 'Minor',
  when: 'Prior',
  status: 'Planned',
  likelihood_after: 'Unlikely',
  consequence_after: 'Insignificant',
};

function riskToFormData(risk: Risk): RiskFormData {
  return {
    type: risk.type,
    risk: risk.risk,
    likelihood_before: risk.likelihood_before,
    consequence_before: risk.consequence_before,
    control: risk.control ?? undefined,
    responsible_contact_id: risk.responsible_contact_id,
    when: risk.when,
    status: risk.status,
    comment: risk.comment ?? undefined,
    likelihood_after: risk.likelihood_after,
    consequence_after: risk.consequence_after,
    response: risk.response ?? undefined,
  };
}

export function RiskDialog({
  open,
  onOpenChange,
  risk,
  onSave,
  onDelete,
  mode,
  isSubmitting = false,
}: RiskDialogProps) {
  const { can: canCreate } = usePageCan('risks', 'create');
  const { can: canUpdate } = usePageCan('risks', 'update');
  const { can: canDelete } = usePageCan('risks', 'delete');
  const canSave = mode === 'create' ? canCreate : canUpdate;

  const [submitError, setSubmitError] = useState<string | null>(null);

  const dialogTitle = mode === 'create' ? 'Add risk' : 'Edit risk';
  const formKey = mode === 'edit' && risk != null ? risk.id : 'new-risk';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSubmitError(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (values: RiskFormData) => {
    try {
      setSubmitError(null);
      await onSave(values);
      handleOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save risk');
    }
  };

  const handleDelete = async () => {
    if (risk == null || onDelete == null) return;
    try {
      setSubmitError(null);
      await onDelete(risk.id);
      handleOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete risk');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {submitError != null ? (
              <Alert variant="destructive" role="alert">
                <p>{submitError}</p>
              </Alert>
            ) : null}
            <Form<RiskFormData>
              key={formKey}
              schema={riskFormSchema}
              defaultValues={risk != null ? riskToFormData(risk) : defaultForm}
              onSubmit={handleSubmit}
            >
              {() => (
                <>
                  <FormField
                    name="type"
                    label="Type"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? defaultForm.type)}
                        onValueChange={(value) => value != null && field.onChange(value)}
                      >
                        <SelectTrigger disabled={!canSave || isSubmitting}>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_TYPE_VALUES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {RISK_TYPE_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="risk"
                    label="Risk"
                    required
                    render={({ field }) => (
                      <Textarea
                        value={String(field.value ?? '')}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        disabled={!canSave || isSubmitting}
                      />
                    )}
                  />
                  <FormField
                    name="likelihood_before"
                    label="Likelihood (before)"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? defaultForm.likelihood_before)}
                        onValueChange={(value) => value != null && field.onChange(value)}
                      >
                        <SelectTrigger disabled={!canSave || isSubmitting}>
                          <SelectValue placeholder="Likelihood (before)" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_LIKELIHOOD_VALUES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {RISK_LIKELIHOOD_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="consequence_before"
                    label="Consequence (before)"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? defaultForm.consequence_before)}
                        onValueChange={(value) => value != null && field.onChange(value)}
                      >
                        <SelectTrigger disabled={!canSave || isSubmitting}>
                          <SelectValue placeholder="Consequence (before)" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_CONSEQUENCE_VALUES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {RISK_CONSEQUENCE_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="control"
                    label="Control"
                    render={({ field }) => (
                      <Textarea
                        value={String(field.value ?? '')}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        disabled={!canSave || isSubmitting}
                      />
                    )}
                  />
                  <FormField
                    name="responsible_contact_id"
                    render={({ field }) => (
                      <ResponsibleContactSelect
                        value={(field.value as string | null | undefined) ?? null}
                        onValueChange={(contactId) => field.onChange(contactId)}
                        disabled={!canSave || isSubmitting}
                      />
                    )}
                  />
                  <FormField
                    name="when"
                    label="When"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? defaultForm.when)}
                        onValueChange={(value) => value != null && field.onChange(value)}
                      >
                        <SelectTrigger disabled={!canSave || isSubmitting}>
                          <SelectValue placeholder="When" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_WHEN_VALUES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {RISK_WHEN_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="status"
                    label="Status"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? defaultForm.status)}
                        onValueChange={(value) => value != null && field.onChange(value)}
                      >
                        <SelectTrigger disabled={!canSave || isSubmitting}>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_STATUS_VALUES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {RISK_STATUS_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="comment"
                    label="Comment"
                    render={({ field }) => (
                      <Textarea
                        value={String(field.value ?? '')}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        disabled={!canSave || isSubmitting}
                      />
                    )}
                  />
                  <FormField
                    name="likelihood_after"
                    label="Likelihood (after)"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? defaultForm.likelihood_after)}
                        onValueChange={(value) => value != null && field.onChange(value)}
                      >
                        <SelectTrigger disabled={!canSave || isSubmitting}>
                          <SelectValue placeholder="Likelihood (after)" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_LIKELIHOOD_VALUES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {RISK_LIKELIHOOD_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="consequence_after"
                    label="Consequence (after)"
                    render={({ field }) => (
                      <Select
                        value={String(field.value ?? defaultForm.consequence_after)}
                        onValueChange={(value) => value != null && field.onChange(value)}
                      >
                        <SelectTrigger disabled={!canSave || isSubmitting}>
                          <SelectValue placeholder="Consequence (after)" />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_CONSEQUENCE_VALUES.map((option) => (
                            <SelectItem key={option} value={option}>
                              {RISK_CONSEQUENCE_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FormField
                    name="response"
                    label="Response"
                    render={({ field }) => (
                      <Textarea
                        value={String(field.value ?? '')}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        disabled={!canSave || isSubmitting}
                      />
                    )}
                  />
                  <RiskImpactDisplay risk={mode === 'edit' ? risk : null} pending={mode === 'create'} />
                  <DialogFooter>
                    <SaveActions
                      saveType="submit"
                      saveDisabled={!canSave || isSubmitting}
                      onCancel={() => handleOpenChange(false)}
                      alternateActions={
                        mode === 'edit' && onDelete != null && canDelete ? (
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={() => void handleDelete()}
                          >
                            Delete
                          </Button>
                        ) : undefined
                      }
                    />
                  </DialogFooter>
                </>
              )}
            </Form>
          </DialogBody>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
