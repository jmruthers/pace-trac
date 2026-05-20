import type { RBACSupabaseClient } from '@solvera/pace-core/rbac';
import type { CurrencyRateRow, CurrencyRateFormData } from '@/features/costs/types';
import type { DeleteResult, ListResult, SingleResult } from '@/lib/postgrest-result-types';

type CurrencyRatesSelectBuilder = {
  select(columns: string): {
    eq(column: string, value: string): {
      order(column: string, options: { ascending: boolean }): ListResult<CurrencyRateRow>;
    };
  };
};

type CurrencyRatesInsertBuilder = {
  insert(rows: Array<CurrencyRateFormData & { event_id: string; organisation_id: string }>): {
    select(): { single(): SingleResult<CurrencyRateRow> };
  };
};

type CurrencyRatesUpdateBuilder = {
  update(payload: CurrencyRateFormData): {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        select(): { single(): SingleResult<CurrencyRateRow> };
      };
    };
  };
};

type CurrencyRatesDeleteBuilder = {
  delete(): {
    eq(column: string, value: string): {
      eq(column: string, value: string): DeleteResult;
    };
  };
};

type CurrencyRatesTableClient = CurrencyRatesSelectBuilder &
  CurrencyRatesInsertBuilder &
  CurrencyRatesUpdateBuilder &
  CurrencyRatesDeleteBuilder;

export function currencyRatesTable(client: RBACSupabaseClient): CurrencyRatesTableClient {
  return client.from('trac_currency_rates') as CurrencyRatesTableClient;
}
