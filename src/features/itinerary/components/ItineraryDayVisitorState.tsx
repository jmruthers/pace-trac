import { Alert } from '@solvera/pace-core/components';

export function ItineraryDayVisitorState() {
  return (
    <section>
      <h2>Personalised itinerary unavailable</h2>
      <Alert>
        <p>
          You do not have an event application linked to this event, so assigned transport,
          accommodation, and activities cannot be shown here. Contact your event coordinator if you
          expected a personalised schedule.
        </p>
      </Alert>
    </section>
  );
}
