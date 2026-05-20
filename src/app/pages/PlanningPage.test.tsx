import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlanningPage } from '@/app/pages/PlanningPage';

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    PagePermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    usePageCan: () => ({ can: true, isLoading: false }),
    useSecureSupabase: () => null,
  };
});

vi.mock('@solvera/pace-core/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/hooks')>();
  return {
    ...actual,
    useOptionalEvents: () => ({
      events: [{ id: 'evt-1', name: 'Test Event' }],
      selectedEvent: { id: 'evt-1', name: 'Test Event', organisationId: 'org-1' },
      setSelectedEvent: vi.fn(),
      refreshEvents: vi.fn(),
      isLoading: false,
      error: null,
    }),
  };
});

vi.mock('@/features/planning/context/GoogleMapsPlanningContext', () => ({
  GoogleMapsPlanningProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGoogleMapsPlanning: () => ({
    apiKey: null,
    isLoaded: false,
    isError: true,
    getTimezone: async () => null,
  }),
}));

vi.mock('@/features/planning/components/TransportList', () => ({
  TransportList: () => <p>Transport list mock</p>,
}));
vi.mock('@/features/planning/components/AccommodationList', () => ({
  AccommodationList: () => <p>Accommodation list mock</p>,
}));
vi.mock('@/features/planning/components/ActivityList', () => ({
  ActivityList: () => <p>Activity list mock</p>,
}));

function renderPlanningPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlanningPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PlanningPage', () => {
  afterEach(cleanup);

  it('renders planning heading and snapshot explainer', () => {
    renderPlanningPage();
    expect(screen.getByRole('heading', { name: 'Planning' })).toBeInTheDocument();
    expect(screen.getByText(/point-in-time snapshots/i)).toBeInTheDocument();
  });

  it('renders transport, accommodation, and activity tabs', () => {
    renderPlanningPage();
    expect(screen.getByRole('tab', { name: 'Transport' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Accommodation' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByText('Transport list mock')).toBeInTheDocument();
  });
});
