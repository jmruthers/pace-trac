/**
 * SLICE-07 currency-rates page auth (TR07 testing requirements §3).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

vi.mock('@/features/costs/CurrencyRatesContent', () => ({
  CurrencyRatesContent: () => <p>Currency rates content mock</p>,
}));

import { CurrencyRatesPage } from '@/app/pages/CurrencyRatesPage';

describe('currency-rates page integration (TR07)', () => {
  beforeEach(() => {
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
  });

  afterEach(cleanup);

  it('auth / permission failure: user without currency-rates read sees denial', () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/currency-rates']}>
        <CurrencyRatesPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/do not have permission to view this page/i)).toBeInTheDocument();
  });
});
