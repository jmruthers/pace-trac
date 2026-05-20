import type { RBACSupabaseClient, SecureSupabaseClient } from '@solvera/pace-core/rbac';
import { asAssignmentsClient } from '@/features/assignments/supabase-helpers';
import type { SupabaseError } from '@/lib/postgrest-result-types';

export type ItinerarySupabaseClient = NonNullable<ReturnType<typeof asAssignmentsClient>> & {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: SupabaseError | null }>;
};

export function asItineraryClient(
  client: RBACSupabaseClient | SecureSupabaseClient | null
): ItinerarySupabaseClient | null {
  if (client == null) return null;
  return client as unknown as ItinerarySupabaseClient;
}
