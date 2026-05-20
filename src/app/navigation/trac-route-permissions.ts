import type { NavigationItem } from '@solvera/pace-core/components';
import { TRAC_PRIMARY_NAV_DEFINITIONS } from '@/app/navigation/trac-nav-definitions';

export type TracRoutePermissionOperation = 'read';

export interface TracRoutePermissionConfig {
  pageName: string;
  operation: TracRoutePermissionOperation;
}

/** RBAC permission string for a TRAC page id (e.g. `read:page.planning`). */
export function tracNavPermissionForPage(pageId: string): string {
  return `read:page.${pageId}`;
}

/** Nav `id` → page permission config (from `pageId`). */
export const TRAC_ROUTE_PERMISSIONS: Record<string, TracRoutePermissionConfig> = Object.fromEntries(
  TRAC_PRIMARY_NAV_DEFINITIONS.map((item) => [
    item.id,
    {
      pageName: item.pageId ?? item.id,
      operation: 'read' as const,
    },
  ])
);

/** Route path → read operation for shell route checks (excludes `/` and `/dashboard`). */
export const TRAC_ROUTE_PATH_PERMISSIONS: Record<string, TracRoutePermissionOperation> = {
  ...Object.fromEntries(
    TRAC_PRIMARY_NAV_DEFINITIONS.filter((item) => item.href != null).map((item) => [item.href!, 'read'])
  ),
  '/currency-rates': 'read',
};

/** Secondary routes (not in primary nav) → RBAC page id. */
export const TRAC_SECONDARY_ROUTE_PAGE_IDS: Record<string, string> = {
  '/currency-rates': 'currency-rates',
};

/** Nav `id` → RBAC `pageId` for registration alignment. */
export const TRAC_PAGE_ID_MAPPING: Record<string, string> = Object.fromEntries(
  TRAC_PRIMARY_NAV_DEFINITIONS.filter((item) => item.pageId != null).map((item) => [item.id, item.pageId!])
);

/** Permission config for the current pathname, if the route is in the IA map. */
export function getTracRoutePermissionForPath(pathname: string): TracRoutePermissionConfig | undefined {
  const operation = TRAC_ROUTE_PATH_PERMISSIONS[pathname];
  if (operation == null) return undefined;

  const secondaryPageId = TRAC_SECONDARY_ROUTE_PAGE_IDS[pathname];
  if (secondaryPageId != null) {
    return { pageName: secondaryPageId, operation };
  }

  const navItem = TRAC_PRIMARY_NAV_DEFINITIONS.find((item) => item.href === pathname);
  if (navItem?.pageId == null) return undefined;
  return { pageName: navItem.pageId, operation };
}

/** Attach `permissions` to nav items for layout/menu enforcement when links are enabled. */
export function withTracNavPermissions(items: readonly NavigationItem[]): NavigationItem[] {
  return items.map((item) => {
    if (item.pageId == null) return { ...item };
    return {
      ...item,
      permissions: [tracNavPermissionForPage(item.pageId)],
    };
  });
}
