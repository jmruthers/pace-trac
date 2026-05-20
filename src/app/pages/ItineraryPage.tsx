import { LoadingSpinner } from '@solvera/pace-core/components';
import { AccessDenied, PagePermissionGuard } from '@solvera/pace-core/rbac';
import { ItineraryContent } from '@/features/itinerary/ItineraryContent';
import { GoogleMapsPlanningProvider } from '@/features/planning/context/GoogleMapsPlanningContext';

/** SLICE-05 — person-aware read-only itinerary at `/itinerary`. */
export function ItineraryPage() {
  return (
    <PagePermissionGuard
      pageName="itinerary"
      operation="read"
      loading={
        <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
          <LoadingSpinner label="Checking access…" />
        </main>
      }
      fallback={<AccessDenied />}
    >
      <main>
        <GoogleMapsPlanningProvider>
          <ItineraryContent />
        </GoogleMapsPlanningProvider>
      </main>
    </PagePermissionGuard>
  );
}
