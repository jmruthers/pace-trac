/**
 * SLICE-04 assignments integration tests (TR04 testing requirements).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import type { AssignmentRow } from '@/features/assignments/types';
import { mapAssignmentError } from '@/features/assignments/errors';
import {
  getAssignedCount,
  requiresOverCapacityConfirmation,
} from '@/features/assignments/headcount';

const mockUseSecureSupabase = vi.fn();
const mockUsePageCan = vi.fn();

vi.mock('@solvera/pace-core/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/hooks')>();
  return {
    ...actual,
    useOptionalEvents: () => ({
      selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
      isLoading: false,
    }),
    useEvents: () => ({
      selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
      isLoading: false,
    }),
  };
});

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    useSecureSupabase: () => mockUseSecureSupabase(),
    usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
    useResolvedScope: () => ({
      eventId: 'event-1',
      organisationId: 'org-1',
      appId: 'app-1',
      isLoading: false,
    }),
    PagePermissionGuard: ({
      children,
      fallback,
    }: {
      children: ReactNode;
      fallback?: ReactNode;
    }) => {
      const { can, isLoading } = mockUsePageCan();
      if (isLoading) return null;
      if (!can) return fallback ?? null;
      return children;
    },
  };
});

import { useAssignmentMutations } from '@/features/assignments/hooks/useAssignmentMutations';
import { AssignmentsPage } from '@/app/pages/AssignmentsPage';

const EVENT_ID = 'event-1';
const ORG_ID = 'org-1';
const ACTIVITY_ID = 'activity-1';
const APP_ID = 'app-participant-1';

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function assignmentKey(
  row: Pick<AssignmentRow, 'application_id' | 'resource_type' | 'resource_id'>
): string {
  return `${String(row.application_id)}:${String(row.resource_type)}:${String(row.resource_id)}`;
}

function buildAssignmentsMockSupabase() {
  let assignmentStore: AssignmentRow[] = [];

  const listAssignments = async () => ({
    data: assignmentStore,
    error: null,
  });

  return {
    from: vi.fn((table: string) => {
      if (table === 'trac_itinerary_assignment') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(listAssignments),
                })),
              })),
            })),
          })),
          insert: vi.fn((row: Record<string, unknown>) => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const resourceId = row.resource_id as string;
                if (resourceId === 'bad-resource-id') {
                  return {
                    data: null,
                    error: {
                      code: 'P0001',
                      message: 'trac_itinerary_assignment_validate_resource failed',
                    },
                  };
                }
                const key = assignmentKey({
                  application_id: String(row.application_id),
                  resource_type: row.resource_type as AssignmentRow['resource_type'],
                  resource_id: String(row.resource_id),
                });
                const duplicate = assignmentStore.some(
                  (existing) => assignmentKey(existing) === key
                );
                if (duplicate) {
                  return {
                    data: null,
                    error: { code: '23505', message: 'duplicate key value' },
                  };
                }
                const newRow: AssignmentRow = {
                  id: 'assign-new',
                  application_id: String(row.application_id),
                  resource_type: row.resource_type as AssignmentRow['resource_type'],
                  resource_id: String(row.resource_id),
                  event_id: EVENT_ID,
                  organisation_id: ORG_ID,
                  notes: (row.notes as string | null) ?? null,
                  created_at: '2026-01-01T00:00:00Z',
                  updated_at: '2026-01-01T00:00:00Z',
                  created_by: null,
                  updated_by: null,
                };
                assignmentStore = [...assignmentStore, newRow];
                return { data: newRow, error: null };
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(async () => ({ data: assignmentStore[0], error: null })),
                })),
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: null })),
            })),
          })),
        };
      }

      if (table === 'base_application') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(async () => ({
                  data: [
                    {
                      id: APP_ID,
                      event_id: EVENT_ID,
                      status: 'approved',
                      first_name: 'Pat',
                      surname: 'Participant',
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(async () => ({ data: [], error: null })),
          })),
        })),
      };
    }),
    getAssignments: () => assignmentStore,
  };
}

describe('assignments integration (SLICE-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
  });

  afterEach(cleanup);

  it('happy path: planner assigns participant to activity; headcount updates', async () => {
    const supabase = buildAssignmentsMockSupabase();
    mockUseSecureSupabase.mockReturnValue(supabase);

    const { result } = renderHook(() => useAssignmentMutations(), {
      wrapper: createQueryWrapper(),
    });

    await result.current.createAssignment({
      application_id: APP_ID,
      resource_type: 'activity',
      resource_id: ACTIVITY_ID,
      notes: 'Seat A',
    });

    const store = supabase.getAssignments();
    expect(store).toHaveLength(1);
    expect(store[0]?.application_id).toBe(APP_ID);
    expect(getAssignedCount(store)).toBe(1);
  });

  it('validation failure: non-existent resource_id is rejected with actionable error', async () => {
    const supabase = buildAssignmentsMockSupabase();
    mockUseSecureSupabase.mockReturnValue(supabase);

    const { result } = renderHook(() => useAssignmentMutations(), {
      wrapper: createQueryWrapper(),
    });

    await expect(
      result.current.createAssignment({
        application_id: APP_ID,
        resource_type: 'activity',
        resource_id: 'bad-resource-id',
      })
    ).rejects.toThrow(/valid logistics row/i);

    expect(supabase.getAssignments()).toHaveLength(0);
  });

  it('maps duplicate assignment constraint to friendly message', () => {
    const err = mapAssignmentError({ code: '23505', message: 'duplicate key' });
    expect(err.message).toMatch(/already assigned/i);
  });

  it('integration: duplicate assignment insert is rejected with friendly error', async () => {
    const supabase = buildAssignmentsMockSupabase();
    mockUseSecureSupabase.mockReturnValue(supabase);

    const { result } = renderHook(() => useAssignmentMutations(), {
      wrapper: createQueryWrapper(),
    });

    const input = {
      application_id: APP_ID,
      resource_type: 'activity' as const,
      resource_id: ACTIVITY_ID,
    };

    await result.current.createAssignment(input);

    await expect(result.current.createAssignment(input)).rejects.toThrow(/already assigned/i);
    expect(supabase.getAssignments()).toHaveLength(1);
  });

  it('auth / permission failure: no planning permission shows AccessDenied', () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/assignments']}>
        <QueryClientProvider client={new QueryClient()}>
          <AssignmentsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/do not have permission to view this page/i)).toBeInTheDocument();
  });

  it('over-capacity confirmation required when save would exceed capacity', () => {
    expect(requiresOverCapacityConfirmation(10, 10, 1)).toBe(true);
    expect(requiresOverCapacityConfirmation(5, 10, 1)).toBe(false);
  });
});
