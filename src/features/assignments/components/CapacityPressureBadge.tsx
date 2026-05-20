import { Badge } from '@solvera/pace-core/components';
import type { CapacityPressure } from '@/features/assignments/headcount';

const PRESSURE_LABEL: Record<CapacityPressure, string> = {
  ok: 'Within capacity',
  near: 'Near capacity',
  over: 'Over capacity',
};

const PRESSURE_CLASS: Record<CapacityPressure, string> = {
  ok: 'bg-main-100 text-main-800 border-main-200',
  near: 'bg-acc-100 text-acc-800 border-acc-300',
  over: 'bg-acc-200 text-acc-900 border-acc-500',
};

interface CapacityPressureBadgeProps {
  pressure: CapacityPressure;
}

export function CapacityPressureBadge({ pressure }: CapacityPressureBadgeProps) {
  return (
    <Badge className={PRESSURE_CLASS[pressure]}>{PRESSURE_LABEL[pressure]}</Badge>
  );
}
