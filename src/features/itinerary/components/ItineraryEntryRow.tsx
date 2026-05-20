import { Link } from 'react-router-dom';
import type { DerivedItineraryDayEntry } from '@solvera/pace-core/itinerary';
import {
  formatEntryKind,
  formatOrderingTime,
  isSameLocalDay,
} from '@/features/itinerary/format-entry-kind';
import type { ItineraryResourceDisplay } from '@/features/itinerary/types';

const RESOURCE_TYPE_LABELS = {
  transport: 'Transport',
  activity: 'Activity',
  accommodation: 'Accommodation',
} as const;

interface ItineraryEntryRowProps {
  entry: DerivedItineraryDayEntry;
  display: ItineraryResourceDisplay;
  participantView: boolean;
  canLinkToPlanning: boolean;
}

export function ItineraryEntryRow({
  entry,
  display,
  participantView,
  canLinkToPlanning,
}: ItineraryEntryRowProps) {
  const typeLabel = RESOURCE_TYPE_LABELS[entry.resourceType];
  const headingPrefix = participantView ? 'Your ' : '';
  const timeLabel = formatOrderingTime(entry.orderingTimestamp);

  const sameDayStay =
    display.resourceType === 'accommodation' &&
    display.checkInTime != null &&
    display.checkOutTime != null &&
    isSameLocalDay(display.checkInTime, display.checkOutTime, entry.timezone);

  const scheduleLine =
    sameDayStay && entry.entryKind === 'check-in'
      ? `Check-in — ${formatOrderingTime(display.checkInTime ?? null)} · Check-out — ${formatOrderingTime(display.checkOutTime ?? null)}${entry.timezone ? ` (${entry.timezone})` : ''}`
      : `${formatEntryKind(entry.entryKind)}${timeLabel ? ` — ${timeLabel}` : ''}${entry.timezone ? ` (${entry.timezone})` : ''}`;

  return (
    <li>
      <article>
        <h4>
          {headingPrefix}
          {typeLabel}: {display.title}
        </h4>
        <p>{scheduleLine}</p>
        {display.subtitle ? <p>{display.subtitle}</p> : null}
        {canLinkToPlanning ? (
          <p>
            <Link to={`/assignments?kind=${entry.resourceType}&resourceId=${entry.resourceId}`}>
              Open assignments
            </Link>
            {' · '}
            <Link to={`/planning?kind=${entry.resourceType}`}>Open planning</Link>
          </p>
        ) : null}
      </article>
    </li>
  );
}
