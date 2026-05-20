import { LoadingSpinner } from '@solvera/pace-core/components';
import { AccessDenied, PagePermissionGuard } from '@solvera/pace-core/rbac';
import { CostsContent } from '@/features/costs/CostsContent';

/** SLICE-07 — event cost rollups at `/costs`. */
export function CostsPage() {
  return (
    <PagePermissionGuard
      pageName="costs"
      operation="read"
      loading={
        <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
          <LoadingSpinner label="Checking access…" />
        </main>
      }
      fallback={<AccessDenied />}
    >
      <CostsContent />
    </PagePermissionGuard>
  );
}
