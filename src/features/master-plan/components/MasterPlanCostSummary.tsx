import { CostsBreakdownTable } from '@/features/costs/components/CostsBreakdownTable';
import { CostsSummary } from '@/features/costs/components/CostsSummary';
import { useCostRollupData } from '@/features/costs/hooks/useCostRollupData';
import { MasterPlanSectionShell } from '@/features/master-plan/components/MasterPlanSectionShell';

export function MasterPlanCostSummary() {
  const { rollup, isLoading, isError, error } = useCostRollupData();

  return (
    <MasterPlanSectionShell
      title="Costs"
      isLoading={isLoading}
      isError={isError}
      error={error}
      className="break-after-page"
    >
      {rollup != null ? (
        <>
          <p>
            Event cost summary for {rollup.approvedParticipantCount} approved participant
            {rollup.approvedParticipantCount === 1 ? '' : 's'}. Resource rows below show
            assigned participant counts for each logistics item.
          </p>
          <CostsSummary rollup={rollup} showCurrencyManagementLink={false} />
          {rollup.rowBreakdowns.length === 0 ? (
            <p>No logistics rows with cost data for this event yet.</p>
          ) : (
            <CostsBreakdownTable rollup={rollup} />
          )}
        </>
      ) : null}
    </MasterPlanSectionShell>
  );
}
