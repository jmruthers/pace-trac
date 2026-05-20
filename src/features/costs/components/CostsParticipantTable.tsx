import { useMemo } from 'react';
import { Card, DataTable, type DataTableColumn } from '@solvera/pace-core/components';
import { useApprovedApplications } from '@/features/assignments/hooks/useApprovedApplications';
import { formatCostAmount } from '@/features/costs/currency-format';
import type { CostRollupResult } from '@/features/costs/types';

interface ParticipantRow extends Record<string, unknown> {
  applicationId: string;
  participantLabel: string;
  allocatedTotalBase: number;
  allocatedTotalDisplay: string;
}

function formatParticipantLabel(
  firstName: string | null,
  surname: string | null,
  applicationId: string
): string {
  const parts = [firstName?.trim(), surname?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return applicationId;
}

interface CostsParticipantTableProps {
  rollup: CostRollupResult;
}

export function CostsParticipantTable({ rollup }: CostsParticipantTableProps) {
  const { applications, isLoading } = useApprovedApplications();

  const labelByApplicationId = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of applications) {
      map.set(app.id, formatParticipantLabel(app.first_name, app.surname, app.id));
    }
    return map;
  }, [applications]);

  const rows: ParticipantRow[] = useMemo(() => {
    return Object.entries(rollup.participantTotalsByApplicationId)
      .filter(([, total]) => total > 0)
      .map(([applicationId, total]) => ({
        applicationId,
        participantLabel: labelByApplicationId.get(applicationId) ?? applicationId,
        allocatedTotalBase: total,
        allocatedTotalDisplay: formatCostAmount(total, rollup.baseCurrency),
      }))
      .sort((a, b) => a.participantLabel.localeCompare(b.participantLabel));
  }, [rollup.participantTotalsByApplicationId, rollup.baseCurrency, labelByApplicationId]);

  const columns: DataTableColumn<ParticipantRow>[] = useMemo(
    () => [
      {
        accessorKey: 'participantLabel',
        header: 'Participant',
        sortable: true,
        searchable: true,
      },
      {
        accessorKey: 'allocatedTotalDisplay',
        header: 'R2 allocated total',
        sortable: true,
      },
    ],
    []
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <section className="grid gap-2 p-4">
        <h2>Per-participant allocation (R2)</h2>
        <p>
          Sum of assigned shares across logistics rows: individual cost plus group cost divided by
          assigned count per resource.
        </p>
      </section>
      <DataTable
        data={rows as unknown as Record<string, unknown>[]}
        columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
        rbac={{ pageName: 'costs' }}
        features={{
          search: true,
          pagination: true,
          sorting: true,
          creation: false,
          editing: false,
          deletion: false,
        }}
        isLoading={isLoading}
        getRowId={(row) => String((row as ParticipantRow).applicationId)}
      />
    </Card>
  );
}
