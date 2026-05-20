import { LoadingSpinner } from '@solvera/pace-core/components';
import { AccessDenied, PagePermissionGuard } from '@solvera/pace-core/rbac';
import { CurrencyRatesContent } from '@/features/costs/CurrencyRatesContent';

/** SLICE-07 — currency rate management at `/currency-rates`. */
export function CurrencyRatesPage() {
  return (
    <PagePermissionGuard
      pageName="currency-rates"
      operation="read"
      loading={
        <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
          <LoadingSpinner label="Checking access…" />
        </main>
      }
      fallback={<AccessDenied />}
    >
      <CurrencyRatesContent />
    </PagePermissionGuard>
  );
}
