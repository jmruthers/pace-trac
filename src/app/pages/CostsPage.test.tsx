import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CostsPage } from '@/app/pages/CostsPage';

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    PagePermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    usePageCan: () => ({ can: true, isLoading: false }),
    useSecureSupabase: () => null,
    useResolvedScope: () => ({
      eventId: 'evt-1',
      organisationId: 'org-1',
      isLoading: false,
    }),
  };
});

vi.mock('@/features/costs/CostsContent', () => ({
  CostsContent: () => <p>Costs content mock</p>,
}));

describe('CostsPage', () => {
  afterEach(cleanup);

  it('renders costs content inside guard when permitted', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <CostsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Costs content mock')).toBeInTheDocument();
  });
});
