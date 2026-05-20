import { LoadingSpinner } from '@solvera/pace-core/components';
import { AccessDenied, PagePermissionGuard } from '@solvera/pace-core/rbac';
import { AssignmentsContent } from '@/features/assignments/AssignmentsContent';

/** SLICE-04 — participant assignments at `/assignments` (planning RBAC v1). */
export function AssignmentsPage() {
  return (
    <PagePermissionGuard
      pageName="planning"
      operation="read"
      loading={
        <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
          <LoadingSpinner label="Checking access…" />
        </main>
      }
      fallback={<AccessDenied />}
    >
      <main>
        <AssignmentsContent />
      </main>
    </PagePermissionGuard>
  );
}
