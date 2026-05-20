import { describe, it, expect } from 'vitest';
import {
  TRAC_ROUTE_PERMISSIONS,
  TRAC_PAGE_ID_MAPPING,
  getTracRoutePermissionForPath,
  tracNavPermissionForPage,
  withTracNavPermissions,
} from '@/app/navigation/trac-route-permissions';

describe('trac-route-permissions', () => {
  it('maps nav ids to read page permissions', () => {
    expect(TRAC_ROUTE_PERMISSIONS.planning).toEqual({
      pageName: 'planning',
      operation: 'read',
    });
    expect(tracNavPermissionForPage('planning')).toBe('read:page.planning');
  });

  it('exposes pageId mapping for RBAC registration', () => {
    expect(TRAC_PAGE_ID_MAPPING.planning).toBe('planning');
    expect(TRAC_PAGE_ID_MAPPING.assignments).toBe('planning');
  });

  it('resolves route path permissions for IA routes', () => {
    expect(getTracRoutePermissionForPath('/planning')).toEqual({
      pageName: 'planning',
      operation: 'read',
    });
    expect(getTracRoutePermissionForPath('/journal')).toEqual({
      pageName: 'journal',
      operation: 'read',
    });
    expect(getTracRoutePermissionForPath('/risks')).toEqual({
      pageName: 'risks',
      operation: 'read',
    });
    expect(getTracRoutePermissionForPath('/itinerary')).toEqual({
      pageName: 'itinerary',
      operation: 'read',
    });
    expect(getTracRoutePermissionForPath('/costs')).toEqual({
      pageName: 'costs',
      operation: 'read',
    });
    expect(getTracRoutePermissionForPath('/currency-rates')).toEqual({
      pageName: 'currency-rates',
      operation: 'read',
    });
    expect(getTracRoutePermissionForPath('/')).toBeUndefined();
  });

  it('attaches permissions to enabled nav items', () => {
    const items = withTracNavPermissions([
      { id: 'planning', label: 'Planning', href: '/planning', pageId: 'planning' },
    ]);
    expect(items[0]?.permissions).toEqual(['read:page.planning']);
  });
});
