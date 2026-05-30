import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardPlanningCounts } from '@/features/dashboard/hooks/useDashboardPlanningCounts';

const mockTransport = vi.fn();
const mockAccommodation = vi.fn();
const mockActivity = vi.fn();

vi.mock('@/features/planning/hooks/useLogisticsList', () => ({
  useTransportList: () => mockTransport(),
  useAccommodationList: () => mockAccommodation(),
  useActivityList: () => mockActivity(),
}));

function listState(items: { status: string }[]) {
  return {
    items,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

describe('useDashboardPlanningCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTransport.mockReturnValue(listState([{ status: 'planned' }, { status: 'confirmed' }]));
    mockAccommodation.mockReturnValue(listState([{ status: 'planned' }]));
    mockActivity.mockReturnValue(listState([]));
  });

  it('aggregates status counts from logistics lists', () => {
    const { result } = renderHook(() => useDashboardPlanningCounts());

    expect(result.current.transport.total).toBe(2);
    expect(result.current.transport.confirmed).toBe(1);
    expect(result.current.accommodation.total).toBe(1);
    expect(result.current.accommodation.confirmed).toBe(0);
    expect(result.current.activity.total).toBe(0);
    expect(result.current.isError).toBe(false);
  });

  it('surfaces first list error without throwing', () => {
    const transportError = new Error('transport failed');
    mockTransport.mockReturnValue({
      items: [],
      isLoading: false,
      isError: true,
      error: transportError,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useDashboardPlanningCounts());

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(transportError);
    expect(result.current.transport.total).toBe(0);
  });
});
