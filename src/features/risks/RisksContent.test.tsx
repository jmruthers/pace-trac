import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RisksContent } from '@/features/risks/RisksContent';
import type { Risk } from '@/features/risks/types';

const mockUseRisks = vi.fn();
const mockUsePaceMain = vi.fn();
const mockUsePageCan = vi.fn();

vi.mock('@solvera/pace-core/hooks', () => ({
  usePaceMain: (...args: unknown[]) => mockUsePaceMain(...args),
}));

vi.mock('@solvera/pace-core/rbac', () => ({
  usePageCan: (...args: unknown[]) => mockUsePageCan(...args),
}));

vi.mock('@/features/risks/hooks/use-risks', () => ({
  useRisks: () => mockUseRisks(),
}));

vi.mock('@/features/risks/components/RiskDialog', () => ({
  RiskDialog: () => null,
}));

vi.mock('@/features/risks/components/RisksRegisterCard', () => ({
  RisksRegisterCard: ({ children }: { children: ReactNode }) => <article>{children}</article>,
}));

vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  return {
    ...actual,
    DataTable: ({ data }: { data: Array<{ risk: string }> }) => (
      <table>
        <tbody>
          {data.map((row) => (
            <tr key={row.risk}>
              <td>{row.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    Alert: ({ children }: { children: ReactNode }) => <div role="alert">{children}</div>,
    Card: ({ children, className }: { children: ReactNode; className?: string }) => (
      <article className={className}>{children}</article>
    ),
  };
});

const sampleRisk: Risk = {
  id: 'risk-1',
  event_id: 'event-1',
  organisation_id: 'org-1',
  type: 'Operational',
  risk: 'Venue delay',
  likelihood_before: 'Possible',
  consequence_before: 'Minor',
  control: null,
  responsible_contact_id: null,
  when: 'Prior',
  status: 'Planned',
  comment: null,
  likelihood_after: 'Unlikely',
  consequence_after: 'Insignificant',
  response: null,
  impact_before: 6,
  impact_after: 2,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
  updated_by: null,
};

describe('RisksContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaceMain.mockReturnValue(undefined);
    mockUsePageCan.mockReturnValue({ can: true, isLoading: false });
    mockUseRisks.mockReturnValue({
      risks: [sampleRisk],
      isLoading: false,
      error: null,
      refreshRisks: vi.fn(),
      addRisk: vi.fn(),
      updateRisk: vi.fn(),
      deleteRisk: vi.fn(),
      isSaving: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers print layout metadata via usePaceMain', () => {
    render(<RisksContent />);
    expect(mockUsePaceMain).toHaveBeenCalledWith({
      printTitle: 'Risk Register',
      printPageOrientation: 'landscape',
    });
  });

  it('print action calls window.print without throwing', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<RisksContent />);

    const toolbar = screen.getAllByRole('group', { name: /risk register actions/i })[0];
    expect(toolbar).toBeDefined();
    await user.click(within(toolbar!).getByRole('button', { name: /^print$/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it('renders risk register table', () => {
    render(<RisksContent />);
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  });
});
