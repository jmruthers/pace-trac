// @vitest-environment happy-dom

/**
 * Event context persistence — TRAC EventServiceProvider defaults (TR01).
 */
import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  EventServiceProvider,
  OrganisationServiceProvider,
  useEventServiceContextOptional,
} from '@solvera/pace-core/providers';
import { setupRBAC } from '@solvera/pace-core/rbac';
import { APP_NAME } from '@/app-config';

async function mockGetAppId() {
  return 'app-1';
}

function bootstrapRbac() {
  setupRBAC(mockClient, {
    appName: APP_NAME,
    getAppId: mockGetAppId,
  });
}

const mockClient = {
  rpc: (name: string) => {
    if (name === 'data_user_events_get') {
      return Promise.resolve({
        data: [
          { event_id: 'e2', organisation_id: 'o1', event_name: 'E2' },
          { event_id: 'e1', organisation_id: 'o1', event_name: 'E1' },
        ],
        error: null,
      });
    }
    return Promise.resolve({ data: [], error: null });
  },
  from: (table: string) => {
    if (table === 'core_organisations') {
      return {
        select: () =>
          Promise.resolve({
            data: [
              {
                id: 'o1',
                name: 'O',
                display_name: 'O',
                is_active: true,
                created_at: '',
                updated_at: '',
              },
            ],
            error: null,
          }),
      };
    }
    if (table === 'rbac_organisation_roles') {
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({ data: [{ organisation_id: 'o1', user_id: 'u1', role: 'member' }], error: null }),
        }),
      };
    }
    if (table === 'core_events') {
      return {
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [
                { event_id: 'e2', organisation_id: 'o1', event_name: 'E2' },
                { event_id: 'e1', organisation_id: 'o1', event_name: 'E1' },
              ],
              error: null,
            }),
        }),
      };
    }
    return { select: () => Promise.resolve({ data: [], error: null }) };
  },
};

describe('Event context persistence (TRAC)', () => {
  afterEach(() => {
    localStorage.removeItem('pace_selected_event_id');
  });

  it('restores persisted event id after provider remount', async () => {
    bootstrapRbac();
    localStorage.setItem('pace_selected_event_id', 'e1');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OrganisationServiceProvider
        supabaseClient={mockClient}
        user={{ id: 'u1', created_at: '', updated_at: '' }}
        session={null}
      >
        <EventServiceProvider supabaseClient={mockClient}>
          {children}
        </EventServiceProvider>
      </OrganisationServiceProvider>
    );

    const { result, unmount } = renderHook(() => useEventServiceContextOptional(), { wrapper });
    await waitFor(() => {
      expect(result.current?.selectedEvent?.id).toBe('e1');
    });

    unmount();

    const { result: afterRemount } = renderHook(() => useEventServiceContextOptional(), { wrapper });
    await waitFor(() => {
      expect(afterRemount.current?.selectedEvent?.id).toBe('e1');
    });
  });
});
