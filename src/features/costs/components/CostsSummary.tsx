import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@solvera/pace-core/components';
import { computeAveragePerParticipant, formatCostAmount } from '@/features/costs/currency-format';
import type { CostRollupResult } from '@/features/costs/types';

interface CostsSummaryProps {
  rollup: CostRollupResult;
  /** When false, omits the currency-rates management link (e.g. Master Plan read-only summary). */
  showCurrencyManagementLink?: boolean;
}

export function CostsSummary({
  rollup,
  showCurrencyManagementLink = true,
}: CostsSummaryProps) {
  const averagePerApproved = computeAveragePerParticipant(
    rollup.eventTotalBase,
    rollup.approvedParticipantCount
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event cost summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
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
        {showCurrencyManagementLink ? (
          <fieldset
            aria-label="Currency management"
            className="grid justify-end sm:col-span-2"
          >
            <Link to="/currency-rates">Manage currency rates</Link>
          </fieldset>
        ) : null}
      </CardContent>
    </Card>
  );
}
