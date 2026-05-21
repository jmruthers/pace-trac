import type { RBACSupabaseClient, SecureSupabaseClient } from '@solvera/pace-core/rbac';

type MasterPlanMaybeSingleResult = Promise<{
  data: Record<string, unknown> | null;
  error: { message: string } | null;
}>;

type MasterPlanReadAfterEq = {
  maybeSingle: () => MasterPlanMaybeSingleResult;
};

export type MasterPlanReadSupabaseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => MasterPlanReadAfterEq;
    };
  };
};

export function asMasterPlanReadClient(
  client: RBACSupabaseClient | SecureSupabaseClient | null
): MasterPlanReadSupabaseClient | null {
  if (client == null) return null;
  return client as unknown as MasterPlanReadSupabaseClient;
}
