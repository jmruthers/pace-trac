import { Alert } from '@solvera/pace-core/components';

/** Shared timezone interpretation copy (TR05 / Master Plan alignment). */
export function ItineraryTimezoneNotice() {
  return (
    <Alert>
      <p>
        Schedule days use timezone snapshots saved on each logistics row at planning time. They do
        not update automatically when external place data changes.
      </p>
    </Alert>
  );
}
