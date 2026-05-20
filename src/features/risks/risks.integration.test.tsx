/**
 * SLICE-09 risks integration tests (TR09 testing requirements).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import { parseRiskFormData } from '@/features/risks/risk-schema';
import type { Risk, RiskFormData } from '@/features/risks/types';
import type { RiskConsequence } from '@/features/risks/enums/risk-consequence';
import type { RiskLikelihood } from '@/features/risks/enums/risk-likelihood';

const mockUseSecureSupabase = vi.fn();
const mockUseEvents = vi.fn();
const mockUseResourcePermissions = vi.fn();
const mockUsePageCan = vi.fn();

vi.mock('@solvera/pace-core/hooks', () => ({
  useEvents: () => mockUseEvents(),
  usePaceMain: vi.fn(),
}));

vi.mock('@solvera/pace-core/rbac', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/rbac')>();
  return {
    ...actual,
    useSecureSupabase: () => mockUseSecureSupabase(),
    useResourcePermissions: () => mockUseResourcePermissions(),
    usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
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

import { useRisks } from '@/features/risks/hooks/use-risks';
import { RisksPage } from '@/app/pages/RisksPage';

const EVENT_ID = 'event-1';
const ORG_ID = 'org-1';

const LIKELIHOOD_RANK: Record<RiskLikelihood, number> = {
  Rare: 1,
  Unlikely: 2,
  Possible: 3,
  Likely: 4,
  'Almost certain': 5,
};

const CONSEQUENCE_RANK: Record<RiskConsequence, number> = {
  Insignificant: 1,
  Minor: 2,
  Significant: 3,
  Major: 4,
  Severe: 5,
};

function computeImpact(likelihood: RiskLikelihood, consequence: RiskConsequence): number {
  return LIKELIHOOD_RANK[likelihood] * CONSEQUENCE_RANK[consequence];
}

function buildRiskRow(
  payload: Record<string, unknown>,
  id = 'risk-new'
): Risk {
  const likelihood_before = payload.likelihood_before as RiskLikelihood;
  const consequence_before = payload.consequence_before as RiskConsequence;
  const likelihood_after = payload.likelihood_after as RiskLikelihood;
  const consequence_after = payload.consequence_after as RiskConsequence;

  return {
    id,
    event_id: EVENT_ID,
    organisation_id: ORG_ID,
    type: payload.type as Risk['type'],
    risk: payload.risk as string,
    likelihood_before,
    consequence_before,
    control: (payload.control as string | null) ?? null,
    responsible_contact_id: (payload.responsible_contact_id as string | null) ?? null,
    when: payload.when as Risk['when'],
    status: payload.status as Risk['status'],
    comment: (payload.comment as string | null) ?? null,
    likelihood_after,
    consequence_after,
    response: (payload.response as string | null) ?? null,
    impact_before: computeImpact(likelihood_before, consequence_before),
    impact_after: computeImpact(likelihood_after, consequence_after),
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: null,
    updated_by: null,
  };
}

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function buildMockSupabase(initial: Risk[] = []) {
  let store = [...initial];
  let lastInsertPayload: Record<string, unknown> | null = null;

  const listResult = async () => ({ data: store, error: null });

  return {
    from: vi.fn((table: string) => {
      expect(table).toBe('trac_risks');
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(listResult),
          })),
        })),
        insert: vi.fn((rows: Record<string, unknown>[]) => {
          lastInsertPayload = rows[0] ?? null;
          return {
            select: vi.fn(() => ({
              single: vi.fn(async () => {
                const row = buildRiskRow(rows[0] ?? {});
                store = [...store, row];
                return { data: row, error: null };
              }),
            })),
          };
        }),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: store[0], error: null })),
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
    }),
    getStore: () => store,
    getLastInsertPayload: () => lastInsertPayload,
  };
}

const validForm: RiskFormData = {
  type: 'Operational',
  risk: 'Supplier delay',
  likelihood_before: 'Likely',
  consequence_before: 'Major',
  when: 'Prior',
  status: 'Planned',
  likelihood_after: 'Possible',
  consequence_after: 'Significant',
};

describe('risks integration (SLICE-09)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEvents.mockReturnValue({
      selectedEvent: { id: EVENT_ID, organisation_id: ORG_ID },
      isLoading: false,
    });
    mockUseResourcePermissions.mockReturnValue({
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canRead: true,
      canExport: false,
      isLoading: false,
      resilienceStatus: 'ok',
      resilienceErrors: [],
      sourceOutcomes: {},
    });
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
  });

  afterEach(cleanup);

  it('happy path: create risk with L/C; generated impact appears on refetch', async () => {
    const supabase = buildMockSupabase();
    mockUseSecureSupabase.mockReturnValue(supabase);

    const { result } = renderHook(() => useRisks(), { wrapper: createQueryWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.risks).toHaveLength(0);

    await result.current.addRisk(validForm);

    const insertPayload = supabase.getLastInsertPayload();
    expect(insertPayload).not.toBeNull();
    expect(insertPayload).not.toHaveProperty('impact_before');
    expect(insertPayload).not.toHaveProperty('impact_after');

    await waitFor(() => expect(result.current.risks).toHaveLength(1));
    expect(result.current.risks[0]?.impact_before).toBe(computeImpact('Likely', 'Major'));
    expect(result.current.risks[0]?.impact_after).toBe(computeImpact('Possible', 'Significant'));
  });

  it('validation failure: invalid enum rejected', () => {
    expect(() =>
      parseRiskFormData({
        ...validForm,
        likelihood_before: 'High' as (typeof validForm)['likelihood_before'],
      })
    ).toThrow(/valid likelihood/i);
  });

  it('auth / permission failure: no risks permission shows AccessDenied', () => {
    mockUsePageCan.mockReturnValue({ can: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/risks']}>
        <RisksPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/do not have permission to view this page/i)).toBeInTheDocument();
  });
});
