import { ItineraryDayTimeline } from '@/features/itinerary/components/ItineraryDayTimeline';
import { ItineraryTimezoneNotice } from '@/features/itinerary/components/ItineraryTimezoneNotice';
import { useItineraryViewModel } from '@/features/itinerary/hooks/useItineraryViewModel';
import { MasterPlanSectionShell } from '@/features/master-plan/components/MasterPlanSectionShell';

export function MasterPlanItinerarySection() {
  const { model, isLoading, isError, error, audience } = useItineraryViewModel('event');

  const errorMessage = error instanceof Error ? error.message : error != null ? String(error) : null;

  return (
    <MasterPlanSectionShell
      title="Detailed itinerary"
      isLoading={isLoading}
      isError={isError}
      error={errorMessage}
    >
      <ItineraryTimezoneNotice />
      {model != null ? (
        <ItineraryDayTimeline
          dayGroups={model.dayGroups}
          displayByResourceKey={model.displayByResourceKey}
          participantView={false}
          canLinkToPlanning={audience.canReadPlanning}
          sectionTitle="Event itinerary"
        />
      ) : (
        <p>No itinerary entries to show for this event yet.</p>
      )}
    </MasterPlanSectionShell>
  );
}
