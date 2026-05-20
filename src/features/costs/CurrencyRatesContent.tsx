import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Card, DataTable, type DataTableColumn } from '@solvera/pace-core/components';
import { usePaceMain } from '@solvera/pace-core/hooks';
import { parseCurrencyRateFormData } from '@/features/costs/currency-rate-schema';
import { useBaseCurrency } from '@/features/costs/hooks/useBaseCurrency';
import { useCurrencyRates } from '@/features/costs/hooks/useCurrencyRates';
import type { CurrencyRateRow } from '@/features/costs/types';

export function CurrencyRatesContent() {
  usePaceMain({ printTitle: 'Currency rates' });

  const { baseCurrency, isLoading: baseLoading, error: baseError } = useBaseCurrency();
  const {
    rates,
    isLoading,
    error,
    refreshRates,
    addRate,
    updateRate,
    deleteRate,
    canCreate,
    canUpdate,
    canDelete,
  } = useCurrencyRates();

  const handleCreateRow = async (data: Partial<CurrencyRateRow>) => {
    const formData = parseCurrencyRateFormData({
      currency_code: data.currency_code ?? '',
      exchange_rate: data.exchange_rate ?? '',
    });
    await addRate(formData);
    await refreshRates();
  };

  const handleEditRow = async (row: CurrencyRateRow, data: Partial<CurrencyRateRow>) => {
    const formData = parseCurrencyRateFormData({
      currency_code: data.currency_code ?? row.currency_code,
      exchange_rate: data.exchange_rate ?? row.exchange_rate,
    });
    await updateRate(row.id, formData);
    await refreshRates();
  };

  const handleDeleteRow = async (row: CurrencyRateRow) => {
    await deleteRate(row.id);
    await refreshRates();
  };

  const columns: DataTableColumn<CurrencyRateRow>[] = useMemo(
    () => [
      {
        accessorKey: 'currency_code',
        header: 'Currency code',
        sortable: true,
        searchable: true,
        fieldType: 'text',
      },
      {
        accessorKey: 'exchange_rate',
        header: 'Exchange rate',
        sortable: true,
        fieldType: 'number',
      },
    ],
    []
  );

  const loading = isLoading || baseLoading;
  const displayError = error ?? (baseError instanceof Error ? baseError.message : null);

  return (
    <main>
      <section>
        <h1>Currency rates</h1>
        <p>
          Manual exchange rates for this event. Rates convert logistics row currencies into the
          organisation base currency
          {baseCurrency != null ? ` (${baseCurrency})` : ''}.
        </p>
        {displayError != null ? (
          <Alert variant="destructive" role="alert">
            <p>{displayError}</p>
          </Alert>
        ) : null}
        <fieldset aria-label="Costs navigation" className="grid justify-end">
          <Link to="/costs">Back to costs</Link>
        </fieldset>
        <Card>
          <DataTable
            data={rates}
            columns={columns}
            rbac={{ pageName: 'currency-rates' }}
            features={{
              search: true,
              pagination: true,
              sorting: true,
              creation: canCreate,
              editing: canUpdate,
              deletion: canDelete,
            }}
            onCreateRow={canCreate ? handleCreateRow : undefined}
            onEditRow={canUpdate ? handleEditRow : undefined}
            onDeleteRow={canDelete ? handleDeleteRow : undefined}
            isLoading={loading}
            getRowId={(row) => String((row as CurrencyRateRow).id)}
          />
        </Card>
        {!loading && displayError == null && rates.length === 0 ? (
          <p>No currency rates yet. Add rates for foreign currencies used on logistics rows.</p>
        ) : null}
      </section>
    </main>
  );
}
