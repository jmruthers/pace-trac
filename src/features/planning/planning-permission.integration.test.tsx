/**
 * TR03: permission denial — create affordance hidden when usePageCan('planning', 'create') is false.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TransportList } from '@/features/planning/components/TransportList';

const mockUsePageCan = vi.fn();

vi.mock('@solvera/pace-core/rbac', () => ({
  usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
  useSecureSupabase: () => null,
  useResolvedScope: () => ({
    eventId: 'event-1',
    organisationId: 'org-1',
    appId: 'app-1',
    isLoading: false,
  }),
}));

vi.mock('@solvera/pace-core/hooks', () => ({
  useOptionalEvents: () => ({
    selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
    isLoading: false,
  }),
}));

vi.mock('@/features/planning/hooks/useLogisticsList', () => ({
  useTransportList: () => ({
    items: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/planning/hooks/useLogisticsMutations', () => ({
  useTransportMutations: () => ({
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  }),
}));

describe('planning permission integration (TR03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides Add transport when create permission is denied', () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });

    render(
      <MemoryRouter>
        <TransportList />
      </MemoryRouter>
    );

    expect(screen.queryByRole('button', { name: /add transport/i })).toBeNull();
    expect(mockUsePageCan).toHaveBeenCalledWith('planning', 'create');
  });
});
