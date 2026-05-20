import type { ItineraryDayGroup } from '@solvera/pace-core/itinerary';
import { getEntryDisplay } from '@/features/itinerary/build-itinerary-model';
import { ItineraryEntryRow } from '@/features/itinerary/components/ItineraryEntryRow';
import type { ItineraryResourceDisplay } from '@/features/itinerary/types';

interface ItineraryDayTimelineProps {
  dayGroups: ItineraryDayGroup[];
  displayByResourceKey: Record<string, ItineraryResourceDisplay>;
  participantView: boolean;
  canLinkToPlanning: boolean;
  sectionTitle: string;
}

export function ItineraryDayTimeline({
  dayGroups,
  displayByResourceKey,
  participantView,
  canLinkToPlanning,
  sectionTitle,
}: ItineraryDayTimelineProps) {
  if (dayGroups.length === 0) {
    return (
      <section>
        <h2>{sectionTitle}</h2>
        <p>No itinerary entries to show for this view yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>{sectionTitle}</h2>
      {dayGroups.map((group) => (
        <section key={group.dayKey}>
          <h3>{group.dayKey}</h3>
          <ul>
            {group.entries.map((entry) => (
              <ItineraryEntryRow
                key={`${entry.resourceType}:${entry.resourceId}:${entry.entryKind}:${group.dayKey}`}
                entry={entry}
                display={getEntryDisplay(entry, displayByResourceKey)}
                participantView={participantView}
                canLinkToPlanning={canLinkToPlanning}
              />
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
