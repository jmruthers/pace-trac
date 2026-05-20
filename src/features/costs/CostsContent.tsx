import { Alert, LoadingSpinner } from '@solvera/pace-core/components';
import { usePaceMain } from '@solvera/pace-core/hooks';
import { CostsBreakdownTable } from '@/features/costs/components/CostsBreakdownTable';
import { CostsParticipantTable } from '@/features/costs/components/CostsParticipantTable';
import { CostsSummary } from '@/features/costs/components/CostsSummary';
import { useCostRollupData } from '@/features/costs/hooks/useCostRollupData';

export function CostsContent() {
  usePaceMain({ printTitle: 'Costs' });

  const { rollup, isLoading, isError, error } = useCostRollupData();

  if (isLoading) {
    return (
      <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
        <LoadingSpinner label="Loading costs…" />
      </main>
    );
  }

  return (
    <main>
      <section>
        <h1>Costs</h1>
        <p>
          Event totals from transport, accommodation, and activity logistics rows. Amounts convert to
          your organisation base currency using rates on the currency rates page.
        </p>
        {isError && error != null ? (
          <Alert variant="destructive" role="alert">
            <p>{error}</p>
          </Alert>
        ) : null}
        {rollup != null && !isError ? (
          <>
            <CostsSummary rollup={rollup} />
            <CostsParticipantTable rollup={rollup} />
            {rollup.rowBreakdowns.length === 0 ? (
              <p>No logistics rows with cost data for this event yet.</p>
            ) : (
              <CostsBreakdownTable rollup={rollup} />
            )}
          </>
        ) : null}
      </section>
    </main>
  );
}
