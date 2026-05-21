export interface EventDateRangeInput {
  startDate: string | null;
  endDate: string | null;
}

function formatDisplayDate(isoOrDate: string): string {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoOrDate;
  }
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function sameCalendarDay(start: string, end: string): boolean {
  const startParsed = new Date(start);
  const endParsed = new Date(end);
  if (Number.isNaN(startParsed.getTime()) || Number.isNaN(endParsed.getTime())) {
    return start.trim() === end.trim();
  }
  return (
    startParsed.getFullYear() === endParsed.getFullYear() &&
    startParsed.getMonth() === endParsed.getMonth() &&
    startParsed.getDate() === endParsed.getDate()
  );
}

/** Formats event dates for Master Plan header (single day vs range). */
export function formatMasterPlanEventDateRange(input: EventDateRangeInput): string {
  const { startDate, endDate } = input;
  if (startDate == null || startDate.trim() === '') {
    return 'Dates not available';
  }
  const startLabel = formatDisplayDate(startDate);
  if (endDate == null || endDate.trim() === '') {
    return startLabel;
  }
  if (sameCalendarDay(startDate, endDate)) {
    return startLabel;
  }
  return `${startLabel} – ${formatDisplayDate(endDate)}`;
}
