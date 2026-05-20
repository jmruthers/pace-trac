import type { RBACSupabaseClient, SecureSupabaseClient } from '@solvera/pace-core/rbac';

/** Loosely typed supabase query builder for TRAC planning (secure client wraps Supabase). */
export type PlanningSupabaseClient = {
  from: (table: string) => PlanningQueryBuilder;
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: File) => Promise<{ error: { message: string } | null }>;
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
    };
  };
  functions: {
    invoke: (
      name: string,
      options?: { body?: Record<string, unknown> }
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
};

export type PlanningQueryBuilder = {
  select: (columns?: string) => PlanningQueryBuilder;
  eq: (column: string, value: string) => PlanningQueryBuilder;
  order: (
    column: string,
    options: { ascending: boolean }
  ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
  maybeSingle: () => Promise<{
    data: Record<string, unknown> | null;
    error: { message: string } | null;
  }>;
  insert: (
    row: Record<string, unknown> | Record<string, unknown>[]
  ) => {
    select: (columns?: string) => {
      single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
    };
  };
  update: (row: Record<string, unknown>) => {
    eq: (column: string, value: string) => {
      select: (columns?: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
  upsert: (
    row: Record<string, unknown>,
    options: { onConflict: string }
  ) => Promise<{ error: { message: string } | null }>;
};

export function asPlanningClient(
  client: RBACSupabaseClient | SecureSupabaseClient | null
): PlanningSupabaseClient | null {
  if (client == null) return null;
  return client as unknown as PlanningSupabaseClient;
}
