import { useMemo, useState } from 'react';
import { Alert, LoadingSpinner, Tabs, TabsContent, TabsList, TabsTrigger } from '@solvera/pace-core/components';
import { usePaceMain } from '@solvera/pace-core/hooks';
import { collectMapData } from '@/features/itinerary/collect-map-points';
import { ItineraryDayTimeline } from '@/features/itinerary/components/ItineraryDayTimeline';
import { ItineraryDayVisitorState } from '@/features/itinerary/components/ItineraryDayVisitorState';
import { ItineraryMapPanel } from '@/features/itinerary/components/ItineraryMapPanel';
import { ItineraryTimezoneNotice } from '@/features/itinerary/components/ItineraryTimezoneNotice';
import {
  useItineraryViewModel,
  type ItineraryViewTab,
} from '@/features/itinerary/hooks/useItineraryViewModel';

export function ItineraryContent() {
  usePaceMain({ printTitle: 'Itinerary' });

  const [activeTab, setActiveTab] = useState<ItineraryViewTab>('event');
  const { audience, model, isLoading, isError, error } = useItineraryViewModel(activeTab);

  const participantView =
    audience.mode === 'participant' || (audience.mode === 'dual' && activeTab === 'personal');

  const sectionTitle = participantView ? 'Your itinerary' : 'Event itinerary';

  const mapData = useMemo(() => {
    if (!model) return { points: [], transportLegs: [] };
    return collectMapData(model.dayGroups, model.displayByResourceKey);
  }, [model]);

  if (isLoading) {
    return (
      <section className="grid min-h-[40vh] place-items-center" aria-busy="true">
        <LoadingSpinner label="Loading itinerary…" />
      </section>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" role="alert">
        <p>{error instanceof Error ? error.message : 'Failed to load itinerary'}</p>
      </Alert>
    );
  }

  if (audience.mode === 'day_visitor') {
    return (
      <>
        <h1>Itinerary</h1>
        <ItineraryDayVisitorState />
      </>
    );
  }

  return (
    <>
      <h1>Itinerary</h1>
      <p>
        {audience.mode === 'dual'
          ? 'View the full event schedule or your assigned logistics for this event.'
          : participantView
            ? 'Your assigned transport, accommodation, and activities for this event.'
            : 'Time-ordered schedule for transport, accommodation, and activities.'}
      </p>

      <ItineraryTimezoneNotice />

      {model != null && model.skippedResources.length > 0 ? (
        <Alert variant="destructive" role="alert">
          <p>
            Some logistics rows could not be included in the schedule because required dates or
            times are missing or invalid. Fix the row in Planning to restore it.
          </p>
          <ul>
            {model.skippedResources.map((issue) => (
              <li key={`${issue.resourceType}:${issue.resourceId}`}>
                {issue.resourceType} {issue.resourceId.slice(0, 8)}: {issue.message}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {audience.mode === 'dual' ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'event' || value === 'personal') setActiveTab(value);
          }}
        >
          <TabsList>
            <TabsTrigger value="event">Event itinerary</TabsTrigger>
            <TabsTrigger value="personal">Your itinerary</TabsTrigger>
          </TabsList>
          <TabsContent value="event">
            <ItineraryPanels
              model={model}
              mapData={mapData}
              participantView={false}
              canLinkToPlanning={audience.canReadPlanning}
              sectionTitle="Event itinerary"
            />
          </TabsContent>
          <TabsContent value="personal">
            <ItineraryPanels
              model={model}
              mapData={mapData}
              participantView
              canLinkToPlanning={audience.canReadPlanning}
              sectionTitle="Your itinerary"
            />
          </TabsContent>
        </Tabs>
      ) : (
        <ItineraryPanels
          model={model}
          mapData={mapData}
          participantView={participantView}
          canLinkToPlanning={audience.canReadPlanning}
          sectionTitle={sectionTitle}
        />
      )}
    </>
  );
}

function ItineraryPanels({
  model,
  mapData,
  participantView,
  canLinkToPlanning,
  sectionTitle,
}: {
  model: ReturnType<typeof useItineraryViewModel>['model'];
  mapData: ReturnType<typeof collectMapData>;
  participantView: boolean;
  canLinkToPlanning: boolean;
  sectionTitle: string;
}) {
  if (model == null) {
    return <p>No itinerary data available.</p>;
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <ItineraryDayTimeline
        dayGroups={model.dayGroups}
        displayByResourceKey={model.displayByResourceKey}
        participantView={participantView}
        canLinkToPlanning={canLinkToPlanning}
        sectionTitle={sectionTitle}
      />
      <ItineraryMapPanel mapData={mapData} />
    </section>
  );
}
