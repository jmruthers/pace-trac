import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAssignmentsScope } from '@/features/assignments/hooks/useAssignmentsScope';

const mockUseOptionalEvents = vi.fn();
const mockUseResolvedScope = vi.fn();

vi.mock('@solvera/pace-core/hooks', () => ({
  useOptionalEvents: () => mockUseOptionalEvents(),
}));

vi.mock('@solvera/pace-core/rbac', () => ({
  useResolvedScope: () => mockUseResolvedScope(),
}));

describe('useAssignmentsScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is not ready when no event is selected', () => {
    mockUseOptionalEvents.mockReturnValue({
      selectedEvent: null,
      isLoading: false,
    });
    mockUseResolvedScope.mockReturnValue({
      eventId: null,
      organisationId: 'org-1',
      appId: 'app-1',
      isLoading: false,
    });

    const { result } = renderHook(() => useAssignmentsScope());

    expect(result.current.isReady).toBe(false);
    expect(result.current.eventId).toBeNull();
  });

  it('is ready when event and organisation are resolved', () => {
    mockUseOptionalEvents.mockReturnValue({
      selectedEvent: { id: 'event-1', organisation_id: 'org-1' },
      isLoading: false,
    });
    mockUseResolvedScope.mockReturnValue({
      eventId: 'event-1',
      organisationId: 'org-1',
      appId: 'app-1',
      isLoading: false,
    });

    const { result } = renderHook(() => useAssignmentsScope());

    expect(result.current.isReady).toBe(true);
    expect(result.current.eventId).toBe('event-1');
    expect(result.current.organisationId).toBe('org-1');
  });
});
