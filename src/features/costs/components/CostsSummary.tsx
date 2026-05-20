import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@solvera/pace-core/components';
import { computeAveragePerParticipant, formatCostAmount } from '@/features/costs/currency-format';
import type { CostRollupResult } from '@/features/costs/types';

interface CostsSummaryProps {
  rollup: CostRollupResult;
}

export function CostsSummary({ rollup }: CostsSummaryProps) {
  const averagePerApproved = computeAveragePerParticipant(
    rollup.eventTotalBase,
    rollup.approvedParticipantCount
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event cost summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <section className="grid gap-2 sm:grid-cols-2">
          <article>
            <h2>Total cost</h2>
            <p>{formatCostAmount(rollup.eventTotalBase, rollup.baseCurrency)}</p>
          </article>
          <article>
            <h2>Per approved participant (average)</h2>
            <p>
              {formatCostAmount(averagePerApproved, rollup.baseCurrency)}
              {rollup.approvedParticipantCount > 0
                ? ` across ${rollup.approvedParticipantCount} approved participants`
                : ' (no approved participants)'}
            </p>
          </article>
          <article>
            <h2>Assignment-aware allocations</h2>
            <p>
              {rollup.participantsWithAllocation} participant
              {rollup.participantsWithAllocation === 1 ? '' : 's'} with non-zero allocated cost
            </p>
          </article>
        </section>
        <fieldset aria-label="Currency management" className="grid justify-end">
          <Link to="/currency-rates">Manage currency rates</Link>
        </fieldset>
      </CardContent>
    </Card>
  );
}
