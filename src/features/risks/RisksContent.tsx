import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, DataTable, type DataTableColumn } from '@solvera/pace-core/components';
import { RisksRegisterCard } from '@/features/risks/components/RisksRegisterCard';
import { usePaceMain } from '@solvera/pace-core/hooks';
import { usePageCan } from '@solvera/pace-core/rbac';
import { RiskDialog } from '@/features/risks/components/RiskDialog';
import { formatRiskImpact } from '@/features/risks/format-risk-impact';
import { useRisks } from '@/features/risks/hooks/use-risks';
import { RISK_STATUS_LABELS } from '@/features/risks/enums/risk-status';
import { RISK_TYPE_LABELS } from '@/features/risks/enums/risk-type';
import { RISK_WHEN_LABELS } from '@/features/risks/enums/risk-when';
import type { Risk } from '@/features/risks/types';

export function RisksContent() {
  usePaceMain({
    printTitle: 'Risk Register',
    printPageOrientation: 'landscape',
  });

  const { can: canCreate } = usePageCan('risks', 'create');
  const { risks, isLoading, error, refreshRisks, addRisk, updateRisk, deleteRisk, isSaving } =
    useRisks();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

  const openCreate = useCallback(() => {
    setSelectedRisk(null);
    setDialogMode('create');
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((risk: Risk) => {
    setSelectedRisk(risk);
    setDialogMode('edit');
    setDialogOpen(true);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSave = useCallback(
    async (formData: Parameters<typeof addRisk>[0]) => {
      if (dialogMode === 'create') {
        await addRisk(formData);
      } else if (selectedRisk != null) {
        await updateRisk(selectedRisk.id, formData);
      }
      await refreshRisks();
    },
    [addRisk, updateRisk, refreshRisks, dialogMode, selectedRisk]
  );

  const handleDeleteRow = useCallback(
    async (row: Risk) => {
      await deleteRisk(row.id);
      await refreshRisks();
    },
    [deleteRisk, refreshRisks]
  );

  const columns: DataTableColumn<Risk>[] = useMemo(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        sortable: true,
        searchable: true,
        cell: ({ getValue }) => {
          const value = getValue() as Risk['type'];
          return RISK_TYPE_LABELS[value] ?? String(value);
        },
      },
      {
        accessorKey: 'risk',
        header: 'Risk',
        sortable: true,
        searchable: true,
        fieldType: 'text',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        sortable: true,
        cell: ({ getValue }) => {
          const value = getValue() as Risk['status'];
          return RISK_STATUS_LABELS[value] ?? String(value);
        },
      },
      {
        accessorKey: 'when',
        header: 'When',
        sortable: true,
        cell: ({ getValue }) => {
          const value = getValue() as Risk['when'];
          return RISK_WHEN_LABELS[value] ?? String(value);
        },
      },
      {
        accessorKey: 'impact_before',
        header: 'Impact (before)',
        sortable: true,
        cell: ({ row }) => formatRiskImpact(row).before,
      },
      {
        accessorKey: 'impact_after',
        header: 'Impact (after)',
        sortable: true,
        cell: ({ row }) => formatRiskImpact(row).after,
      },
    ],
    []
  );

  const rowActions = useMemo(
    () => [
      {
        label: 'Edit',
        onClick: (row: Risk) => openEdit(row),
      },
    ],
    [openEdit]
  );

  return (
    <main>
      <section>
        <h1>Risks</h1>
        <p>
          Maintain the event risk register. Likelihood and consequence drive generated impact scores
          (read-only after save).
        </p>
        {error != null ? (
          <Alert variant="destructive" role="alert">
            <p>{error}</p>
          </Alert>
        ) : null}
        {!isLoading && error == null && risks.length === 0 ? (
          <p>No risks yet for this event. Use Add risk to create one.</p>
        ) : null}
        <fieldset aria-label="Risk register actions" className="grid justify-end gap-2 print:hidden">
          {canCreate ? (
            <Button type="button" onClick={openCreate}>
              Add risk
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={handlePrint}>
            Print
          </Button>
        </fieldset>
        <RisksRegisterCard>
          <DataTable
            data={risks}
            columns={columns}
            rbac={{ pageName: 'risks' }}
            features={{
              search: true,
              pagination: true,
              sorting: true,
              deletion: true,
              creation: false,
              editing: false,
            }}
            actions={rowActions}
            onDeleteRow={handleDeleteRow}
            isLoading={isLoading}
            getRowId={(row) => String((row as Risk).id)}
          />
        </RisksRegisterCard>
      </section>
      <RiskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        risk={selectedRisk}
        mode={dialogMode}
        onSave={handleSave}
        onDelete={
          dialogMode === 'edit'
            ? async (id) => {
                await deleteRisk(id);
                await refreshRisks();
              }
            : undefined
        }
        isSubmitting={isSaving}
      />
    </main>
  );
}
