import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RisksContent } from '@/features/risks/RisksContent';
import type { Risk, RiskFormData } from '@/features/risks/types';

const mockUseRisks = vi.fn();
const mockUsePaceMain = vi.fn();
const mockUsePageCan = vi.fn();

let capturedOnSave: ((formData: RiskFormData) => Promise<void>) | undefined;
let capturedOnDelete: ((id: string) => Promise<void>) | undefined;

const sampleForm: RiskFormData = {
  type: 'Transport',
  risk: 'Flight cancellation',
  likelihood_before: 'Likely',
  consequence_before: 'Major',
  when: 'During',
  status: 'Planned',
  likelihood_after: 'Possible',
  consequence_after: 'Significant',
};

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
  RiskDialog: ({
    onSave,
    onDelete,
  }: {
    onSave: (formData: RiskFormData) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
  }) => {
    capturedOnSave = onSave;
    capturedOnDelete = onDelete;
    return null;
  },
}));

vi.mock('@/features/risks/components/RisksRegisterCard', () => ({
  RisksRegisterCard: ({ children }: { children: ReactNode }) => <article>{children}</article>,
}));

vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  const { Button } = actual;
  return {
    ...actual,
    DataTable: ({
      data,
      actions,
      onDeleteRow,
    }: {
      data: Risk[];
      actions?: Array<{ label: string; onClick: (row: Risk) => void }>;
      onDeleteRow?: (row: Risk) => void | Promise<void>;
    }) => (
      <table>
        <tbody>
          {data.map((row) => (
            <tr key={row.risk}>
              <td>{row.risk}</td>
              <td>
                {actions?.map((action) => (
                  <Button key={action.label} type="button" onClick={() => action.onClick(row)}>
                    {action.label}
                  </Button>
                ))}
                {onDeleteRow != null ? (
                  <Button type="button" onClick={() => void onDeleteRow(row)}>
                    Delete row
                  </Button>
                ) : null}
              </td>
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
    capturedOnSave = undefined;
    capturedOnDelete = undefined;
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
    cleanup();
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

  it('onSave resolves when mutation succeeds even if refreshRisks would fail', async () => {
    const user = userEvent.setup();
    const addRisk = vi.fn().mockResolvedValue(sampleRisk);
    const refreshRisks = vi.fn().mockRejectedValue(new Error('Refetch failed'));
    mockUseRisks.mockReturnValue({
      risks: [sampleRisk],
      isLoading: false,
      error: null,
      refreshRisks,
      addRisk,
      updateRisk: vi.fn(),
      deleteRisk: vi.fn(),
      isSaving: false,
    });

    render(<RisksContent />);

    const toolbar = screen.getAllByRole('group', { name: /risk register actions/i })[0];
    await user.click(within(toolbar!).getByRole('button', { name: /add risk/i }));

    expect(capturedOnSave).toBeDefined();
    await expect(capturedOnSave!(sampleForm)).resolves.toBeUndefined();
    expect(addRisk).toHaveBeenCalledWith(sampleForm);
    expect(refreshRisks).not.toHaveBeenCalled();
  });

  it('onDelete resolves when deleteRisk succeeds even if refreshRisks would fail', async () => {
    const user = userEvent.setup();
    const deleteRisk = vi.fn().mockResolvedValue(undefined);
    const refreshRisks = vi.fn().mockRejectedValue(new Error('Refetch failed'));
    mockUseRisks.mockReturnValue({
      risks: [sampleRisk],
      isLoading: false,
      error: null,
      refreshRisks,
      addRisk: vi.fn(),
      updateRisk: vi.fn(),
      deleteRisk,
      isSaving: false,
    });

    render(<RisksContent />);

    await user.click(screen.getAllByRole('button', { name: /^edit$/i })[0]!);

    expect(capturedOnDelete).toBeDefined();
    await expect(capturedOnDelete!(sampleRisk.id)).resolves.toBeUndefined();
    expect(deleteRisk).toHaveBeenCalledWith(sampleRisk.id);
    expect(refreshRisks).not.toHaveBeenCalled();
  });

  it('handleDeleteRow resolves when deleteRisk succeeds even if refreshRisks would fail', async () => {
    const user = userEvent.setup();
    const deleteRisk = vi.fn().mockResolvedValue(undefined);
    const refreshRisks = vi.fn().mockRejectedValue(new Error('Refetch failed'));
    mockUseRisks.mockReturnValue({
      risks: [sampleRisk],
      isLoading: false,
      error: null,
      refreshRisks,
      addRisk: vi.fn(),
      updateRisk: vi.fn(),
      deleteRisk,
      isSaving: false,
    });

    render(<RisksContent />);

    await user.click(screen.getAllByRole('button', { name: /delete row/i })[0]!);

    expect(deleteRisk).toHaveBeenCalledWith(sampleRisk.id);
    expect(refreshRisks).not.toHaveBeenCalled();
  });
});
