import {
  deriveItineraryDayEntries,
  getItineraryVisibleDateRange,
  groupItineraryEntriesByDay,
  validateItineraryInputs,
  type DeriveItineraryDayEntriesInput,
  type ItineraryResourceInput,
  type ItineraryScope,
} from '@solvera/pace-core/itinerary';
import { resourceKey } from '@/features/itinerary/map-logistics-to-itinerary-input';
import type { ItineraryBuildIssue, ItineraryModel, ItineraryResourceDisplay } from '@/features/itinerary/types';

function validateSingleResource(
  resource: ItineraryResourceInput,
  eventDefaultTimezone: string | null | undefined
): { valid: boolean; message?: string } {
  const result = validateItineraryInputs({
    resources: [resource],
    eventDefaultTimezone,
  });
  if (result.valid) return { valid: true };
  const first = result.issues[0];
  return {
    valid: false,
    message: first?.message ?? 'Invalid itinerary resource',
  };
}

export function buildItineraryModel(input: {
  resources: ItineraryResourceInput[];
  assignments?: DeriveItineraryDayEntriesInput['assignments'];
  scope?: ItineraryScope;
  eventDefaultTimezone?: string | null;
  displayByResourceKey: Record<string, ItineraryResourceDisplay>;
}): ItineraryModel {
  const validResources: ItineraryResourceInput[] = [];
  const skippedResources: ItineraryBuildIssue[] = [];

  for (const resource of input.resources) {
    const check = validateSingleResource(resource, input.eventDefaultTimezone);
    if (check.valid) {
      validResources.push(resource);
      continue;
    }
    skippedResources.push({
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      message: check.message ?? 'Skipped invalid resource',
    });
  }

  if (validResources.length === 0) {
    return {
      dayGroups: [],
      visibleDateRange: null,
      displayByResourceKey: input.displayByResourceKey,
      skippedResources,
    };
  }

  const deriveInput: DeriveItineraryDayEntriesInput = {
    resources: validResources,
    assignments: input.assignments,
    scope: input.scope,
    eventDefaultTimezone: input.eventDefaultTimezone ?? null,
  };

  const entries = deriveItineraryDayEntries(deriveInput);
  const dayGroups = groupItineraryEntriesByDay(entries);
  const visibleDateRange = getItineraryVisibleDateRange(entries);

  return {
    dayGroups,
    visibleDateRange,
    displayByResourceKey: input.displayByResourceKey,
    skippedResources,
  };
}

export function getEntryDisplay(
  entry: { resourceType: ItineraryResourceInput['resourceType']; resourceId: string },
  displayByResourceKey: Record<string, ItineraryResourceDisplay>
): ItineraryResourceDisplay {
  const key = resourceKey(entry.resourceType, entry.resourceId);
  const display = displayByResourceKey[key];
  if (display) return display;
  return {
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    title: `${entry.resourceType} ${entry.resourceId.slice(0, 8)}`,
    subtitle: null,
    coords: [],
  };
}
