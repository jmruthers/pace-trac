import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ItineraryPage } from '@/app/pages/ItineraryPage';

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

vi.mock('@/features/itinerary/ItineraryContent', () => ({
  ItineraryContent: () => <p>Itinerary content mock</p>,
}));

vi.mock('@/features/planning/context/GoogleMapsPlanningContext', () => ({
  GoogleMapsPlanningProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ItineraryPage', () => {
  afterEach(cleanup);

  it('renders itinerary content inside main when permitted', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <ItineraryPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Itinerary content mock')).toBeInTheDocument();
  });
});
