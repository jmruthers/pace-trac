import { useMemo } from 'react';
import { Card, DataTable, type DataTableColumn } from '@solvera/pace-core/components';
import { formatResourceTypeLabel } from '@/features/costs/cost-labels';
import { formatCostAmount } from '@/features/costs/currency-format';
import type { CostRollupResult, CostRowBreakdown } from '@/features/costs/types';

interface BreakdownRow extends CostRowBreakdown {
  resourceLabel: string;
  conversionStatus: string;
  rowTotalDisplay: string;
}

function toBreakdownRows(rollup: CostRollupResult): BreakdownRow[] {
  return rollup.rowBreakdowns.map((row) => {
    const resourceLabel = row.label ?? formatResourceTypeLabel(row.resourceType);
    const conversionStatus = row.missingRate
      ? 'Missing exchange rate'
      : row.currency != null && row.currency !== rollup.baseCurrency
        ? `Converted to ${rollup.baseCurrency}`
        : rollup.baseCurrency;
    const rowTotalDisplay =
      row.rowTotalBase != null
        ? formatCostAmount(row.rowTotalBase, rollup.baseCurrency)
        : `${row.rowTotalNative.toFixed(2)} ${row.currency ?? '—'} (not converted)`;

    return {
      ...row,
      resourceLabel,
      conversionStatus,
      rowTotalDisplay,
    };
  });
}

interface CostsBreakdownTableProps {
  rollup: CostRollupResult;
  isLoading?: boolean;
}

export function CostsBreakdownTable({ rollup, isLoading = false }: CostsBreakdownTableProps) {
  const rows = useMemo(() => toBreakdownRows(rollup), [rollup]);

  const columns: DataTableColumn<BreakdownRow>[] = useMemo(
    () => [
      {
        accessorKey: 'resourceType',
        header: 'Domain',
        sortable: true,
        cell: ({ getValue }) => formatResourceTypeLabel(getValue() as BreakdownRow['resourceType']),
      },
      {
        accessorKey: 'resourceLabel',
        header: 'Resource',
        sortable: true,
        searchable: true,
      },
      {
        accessorKey: 'assignedCount',
        header: 'Assigned',
        sortable: true,
      },
      {
        accessorKey: 'currency',
        header: 'Currency',
        sortable: true,
        cell: ({ getValue }) => String(getValue() ?? '—'),
      },
      {
        accessorKey: 'rowTotalDisplay',
        header: 'Row total',
        sortable: true,
      },
      {
        accessorKey: 'conversionStatus',
        header: 'Conversion',
        sortable: true,
        searchable: true,
      },
      {
        accessorKey: 'hasUnallocatedGroupCost',
        header: 'Unallocated group',
        cell: ({ getValue }) => (getValue() ? 'Yes' : '—'),
      },
    ],
    []
  );

  return (
    <Card>
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
        getRowId={(row) => `${row.resourceType}:${row.resourceId}`}
      />
    </Card>
  );
}
