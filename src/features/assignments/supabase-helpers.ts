import type { RBACSupabaseClient, SecureSupabaseClient } from '@solvera/pace-core/rbac';

export type AssignmentsSupabaseClient = {
  from: (table: string) => AssignmentsQueryBuilder;
};

export type AssignmentsQueryBuilder = {
  select: (columns?: string) => AssignmentsQueryBuilder;
  eq: (column: string, value: string) => AssignmentsQueryBuilder;
  order: (
    column: string,
    options: { ascending: boolean }
  ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string; code?: string } | null }>;
  insert: (
    row: Record<string, unknown> | Record<string, unknown>[]
  ) => {
    select: (columns?: string) => {
      single: () => Promise<{
        data: Record<string, unknown> | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        select: (columns?: string) => {
          single: () => Promise<{
            data: Record<string, unknown> | null;
            error: { message: string; code?: string } | null;
          }>;
        };
      };
    };
  };
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string; code?: string } | null }>;
    };
  };
};

export function asAssignmentsClient(
  client: RBACSupabaseClient | SecureSupabaseClient | null
): AssignmentsSupabaseClient | null {
  if (client == null) return null;
  return client as unknown as AssignmentsSupabaseClient;
}
