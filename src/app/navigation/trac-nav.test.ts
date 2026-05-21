import { describe, it, expect } from 'vitest';
import {
  getEnabledTracNavItems,
  SLICE_01_REGISTERED_ROUTE_PATHS,
  TRAC_PRIMARY_NAV_DEFINITIONS,
} from '@/app/navigation/trac-nav';

describe('trac-nav', () => {
  it('defines primary nav in IA order', () => {
    const labels = TRAC_PRIMARY_NAV_DEFINITIONS.map((item) => item.label);
    expect(labels).toEqual([
      'Planning',
      'Assignments',
      'Itinerary',
      'Contacts',
      'Costs',
      'Journal',
      'Master Plan',
      'Risks',
    ]);
  });

  it('enables nav links only for registered route paths', () => {
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/planning')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/assignments')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/contacts')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/journal')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/itinerary')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/risks')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/costs')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/masterplan')).toBe(true);
    expect(SLICE_01_REGISTERED_ROUTE_PATHS.has('/currency-rates')).toBe(false);
    const labels = getEnabledTracNavItems().map((item) => item.label);
    expect(labels).toEqual([
      'Planning',
      'Assignments',
      'Itinerary',
      'Contacts',
      'Costs',
      'Journal',
      'Master Plan',
      'Risks',
    ]);
  });
});
