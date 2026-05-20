import { LoadingSpinner } from '@solvera/pace-core/components';
import { AccessDenied, PagePermissionGuard } from '@solvera/pace-core/rbac';
import { RisksContent } from '@/features/risks/RisksContent';

/** SLICE-09 — event risk register at `/risks`. */
export function RisksPage() {
  return (
    <PagePermissionGuard
      pageName="risks"
      operation="read"
      loading={
        <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
          <LoadingSpinner label="Checking access…" />
        </main>
      }
      fallback={<AccessDenied />}
    >
      <RisksContent />
    </PagePermissionGuard>
  );
}
