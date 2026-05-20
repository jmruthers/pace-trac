import { Badge, type BadgeVariant } from '@solvera/pace-core/components';
import { TRAC_STATUS_LABELS, type TracStatus } from '@/features/planning/enums';

const STATUS_VARIANT: Record<TracStatus, BadgeVariant> = {
  idea: 'outline-main-muted',
  planned: 'soft-sec-muted',
  booked: 'solid-main-muted',
  confirmed: 'solid-main-normal',
  dropped: 'soft-sec-normal',
  cancelled: 'solid-acc-muted',
};

export function PlanningStatusBadge({ status }: { status: TracStatus | null }) {
  if (status == null) return <Badge variant="outline-sec-muted">Unknown</Badge>;
  return <Badge variant={STATUS_VARIANT[status]}>{TRAC_STATUS_LABELS[status]}</Badge>;
}
