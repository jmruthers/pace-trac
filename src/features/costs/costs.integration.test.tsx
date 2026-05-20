/**
 * SLICE-07 costs integration tests (TR07 testing requirements).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { computeCostRollup } from '@/features/costs/cost-rollup';

const mockUsePageCan = vi.fn();

vi.mock('@solvera/pace-core/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/hooks')>();
  return {
    ...actual,
    usePaceMain: vi.fn(),
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
    usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
    useSecureSupabase: () => null,
    useResolvedScope: () => ({
      eventId: 'event-1',
      organisationId: 'org-1',
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

const mockRollup = computeCostRollup({
  baseCurrency: 'USD',
  approvedParticipantCount: 2,
  rates: [{ currency_code: 'USD', exchange_rate: 1 }],
  assignments: [
    {
      resource_type: 'transport',
      resource_id: 't1',
      application_id: 'app-1',
    },
  ],
  lines: [
    {
      resourceType: 'transport',
      resourceId: 't1',
      currency: 'USD',
      individual_cost: 10,
      group_cost: 20,
      label: 'Flight',
    },
  ],
});

vi.mock('@/features/costs/hooks/useCostRollupData', () => ({
  useCostRollupData: () => ({
    rollup: mockRollup,
    baseCurrency: 'USD',
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/features/assignments/hooks/useApprovedApplications', () => ({
  useApprovedApplications: () => ({
    applications: [
      {
        id: 'app-1',
        event_id: 'event-1',
        status: 'approved',
        first_name: 'Alex',
        surname: 'Planner',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  return {
    ...actual,
    DataTable: ({ data }: { data: unknown[] }) => (
      <table>
        <tbody>
          {data.map((row, index) => {
            const record = row as Record<string, unknown>;
            const key = String(record.applicationId ?? record.resourceId ?? index);
            const primary =
              (record.participantLabel as string | undefined) ??
              (record.resourceLabel as string | undefined) ??
              '';
            const secondary = record.allocatedTotalDisplay as string | undefined;
            return (
              <tr key={key}>
                <td>{primary}</td>
                {secondary ? <td>{secondary}</td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    ),
  };
});

import { CostsPage } from '@/app/pages/CostsPage';

describe('costs integration (TR07)', () => {
  beforeEach(() => {
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
  });

  afterEach(cleanup);

  it('happy path: shows event total and per-participant summary', () => {
    render(
      <MemoryRouter initialEntries={['/costs']}>
        <CostsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Costs' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Total cost' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Per-participant allocation (R2)' })).toBeInTheDocument();
    expect(screen.getByText('Alex Planner')).toBeInTheDocument();
    expect(screen.getAllByText(/\$30\.00/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('link', { name: 'Manage currency rates' })).toHaveAttribute(
      'href',
      '/currency-rates'
    );
  });

  it('auth / permission failure: user without costs read sees denial', () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/costs']}>
        <CostsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/do not have permission to view this page/i)).toBeInTheDocument();
  });
});
