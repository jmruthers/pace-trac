import type { NavigationItem } from '@solvera/pace-core/components';
import { TRAC_PRIMARY_NAV_DEFINITIONS } from '@/app/navigation/trac-nav-definitions';
import { withTracNavPermissions } from '@/app/navigation/trac-route-permissions';

export { TRAC_PRIMARY_NAV_DEFINITIONS } from '@/app/navigation/trac-nav-definitions';

/** Route paths registered in the current app build (expand as feature slices land). */
export const TRAC_REGISTERED_ROUTE_PATHS = new Set<string>([
  '/',
  '/planning',
  '/assignments',
  '/itinerary',
  '/contacts',
  '/costs',
  '/journal',
  '/risks',
]);

/** @deprecated Use {@link TRAC_REGISTERED_ROUTE_PATHS}. Kept for SLICE-01 test references. */
export const SLICE_01_REGISTERED_ROUTE_PATHS = TRAC_REGISTERED_ROUTE_PATHS;

/**
 * Nav items whose href is registered in the current app build.
 * SLICE-01: empty until domain routes ship — avoids 404 links in the shell strip.
 */
export function getEnabledTracNavItems(
  registeredPaths: ReadonlySet<string> = TRAC_REGISTERED_ROUTE_PATHS
): NavigationItem[] {
  const enabled = TRAC_PRIMARY_NAV_DEFINITIONS.filter(
    (item) => item.href != null && registeredPaths.has(item.href)
  );
  return withTracNavPermissions(enabled);
}
