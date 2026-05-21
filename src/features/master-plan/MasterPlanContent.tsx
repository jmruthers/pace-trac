import { useCallback, useLayoutEffect } from 'react';
import { Alert, Button, LoadingSpinner } from '@solvera/pace-core/components';
import { usePaceMain } from '@solvera/pace-core/hooks';
import { MasterPlanContactsList } from '@/features/master-plan/components/MasterPlanContactsList';
import { MasterPlanCostSummary } from '@/features/master-plan/components/MasterPlanCostSummary';
import { MasterPlanHeader } from '@/features/master-plan/components/MasterPlanHeader';
import { MasterPlanItinerarySection } from '@/features/master-plan/components/MasterPlanItinerarySection';
import { MasterPlanJourneyMap } from '@/features/master-plan/components/MasterPlanJourneyMap';
import { useMasterPlanEventHeader } from '@/features/master-plan/hooks/useMasterPlanEventHeader';

export function MasterPlanContent() {
  usePaceMain({ printTitle: 'Master Plan' });

  const { header, isLoading, isError, error } = useMasterPlanEventHeader();

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    const previous = root.style.getPropertyValue('--print-event-name');
    if (header?.eventName != null && header.eventName.trim() !== '') {
      const escaped = header.eventName.replace(/"/g, '\\"');
      root.style.setProperty('--print-event-name', `"${escaped}"`);
    } else {
      root.style.removeProperty('--print-event-name');
    }
    return () => {
      if (previous !== '') {
        root.style.setProperty('--print-event-name', previous);
      } else {
        root.style.removeProperty('--print-event-name');
      }
    };
  }, [header?.eventName]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (isLoading) {
    return (
      <main className="grid min-h-[50vh] place-items-center px-4" aria-busy="true">
        <LoadingSpinner label="Loading master plan…" />
      </main>
    );
  }

  if (isError || header == null) {
    return (
      <main className="grid gap-4 px-4">
        <h1>Master Plan</h1>
        <Alert variant="destructive" role="alert">
          <p>{error ?? 'Event details could not be loaded for this master plan.'}</p>
        </Alert>
      </main>
    );
  }

  return (
    <main className="grid gap-8">
      <fieldset className="grid justify-end print:hidden" aria-label="Print actions">
        <Button type="button" onClick={handlePrint}>
          Print
        </Button>
      </fieldset>

      <MasterPlanHeader header={header} />

      <MasterPlanJourneyMap />
      <MasterPlanContactsList />
      <MasterPlanCostSummary />
      <MasterPlanItinerarySection />
    </main>
  );
}
