import { LoadingSpinner } from '@solvera/pace-core/components';
import { AccessDenied, PagePermissionGuard } from '@solvera/pace-core/rbac';
import { MasterPlanContent } from '@/features/master-plan/MasterPlanContent';
import { GoogleMapsPlanningProvider } from '@/features/planning/context/GoogleMapsPlanningContext';

/** SLICE-10 — printable operational summary at `/masterplan`. */
export function MasterPlanPage() {
  return (
    <PagePermissionGuard
      pageName="masterplan"
      operation="read"
      loading={
        <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
          <LoadingSpinner label="Checking access…" />
        </main>
      }
      fallback={<AccessDenied />}
    >
      <GoogleMapsPlanningProvider>
        <MasterPlanContent />
      </GoogleMapsPlanningProvider>
    </PagePermissionGuard>
  );
}
