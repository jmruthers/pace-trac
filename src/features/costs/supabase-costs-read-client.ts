import type { RBACSupabaseClient, SecureSupabaseClient } from '@solvera/pace-core/rbac';
import type { LooseListResult } from '@/lib/postgrest-result-types';

export type CostsReadSupabaseClient = {
  from: (table: string) => CostsReadQueryBuilder;
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

type CostsReadAfterTwoEq = {
  order: (column: string, options: { ascending: boolean }) => LooseListResult;
};

type CostsReadAfterOneEq = {
  eq: (column: string, value: string) => CostsReadAfterTwoEq;
  order: (column: string, options: { ascending: boolean }) => LooseListResult;
};

type CostsReadQueryBuilder = {
  select: (columns?: string) => {
    eq: (column: string, value: string) => CostsReadAfterOneEq;
  };
};

export function asCostsReadClient(
  client: RBACSupabaseClient | SecureSupabaseClient | null
): CostsReadSupabaseClient | null {
  if (client == null) return null;
  return client as unknown as CostsReadSupabaseClient;
}
