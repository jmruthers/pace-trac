import type { RBACSupabaseClient } from '@solvera/pace-core/rbac';
import type { Risk, RiskFormData } from '@/features/risks/types';

type SupabaseError = { message: string; code?: string };

type SingleResult<T> = Promise<{ data: T | null; error: SupabaseError | null }>;

type RiskInsertRow = Record<string, unknown> & {
  event_id: string;
  organisation_id: string;
};

interface RisksTableClient {
  select(columns: string): {
    eq(column: string, value: string): {
      order(column: string, options: { ascending: boolean }): Promise<{
        data: Risk[] | null;
        error: SupabaseError | null;
      }>;
    };
  };
  insert(rows: RiskInsertRow[]): {
    select(): { single(): SingleResult<Risk> };
  };
  update(payload: Record<string, unknown>): {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        select(): { single(): SingleResult<Risk> };
      };
    };
  };
  delete(): {
    eq(column: string, value: string): {
      eq(column: string, value: string): Promise<{ error: SupabaseError | null }>;
    };
  };
}

export function risksTable(client: RBACSupabaseClient): RisksTableClient {
  return client.from('trac_risks') as RisksTableClient;
}

export type { RiskFormData };
