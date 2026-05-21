import { useMemo } from 'react';
import { collectTransportJourneyMapData } from '@/features/master-plan/collect-transport-journey-map';
import { ItineraryMapPanel } from '@/features/itinerary/components/ItineraryMapPanel';
import { useTransportList } from '@/features/planning/hooks/useLogisticsList';
import { MasterPlanSectionShell } from '@/features/master-plan/components/MasterPlanSectionShell';

export function MasterPlanJourneyMap() {
  const transport = useTransportList();

  const mapData = useMemo(
    () => collectTransportJourneyMapData(transport.items),
    [transport.items]
  );

  const errorMessage =
    transport.error instanceof Error
      ? transport.error.message
      : transport.error != null
        ? String(transport.error)
        : null;

  return (
    <MasterPlanSectionShell
      title="Journey map"
      isLoading={transport.isLoading}
      isError={transport.isError}
      error={errorMessage}
      className="break-after-page"
    >
      <ItineraryMapPanel mapData={mapData} />
    </MasterPlanSectionShell>
  );
}
