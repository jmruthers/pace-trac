import type { RBACSupabaseClient } from '@solvera/pace-core/rbac';
import type { Contact, ContactFormData } from '@/features/contacts/types';

type SupabaseError = { message: string; code?: string };

type SingleResult<T> = Promise<{ data: T | null; error: SupabaseError | null }>;

interface ContactsTableClient {
  select(columns: string): {
    eq(column: string, value: string): {
      order(column: string, options: { ascending: boolean }): Promise<{
        data: Contact[] | null;
        error: SupabaseError | null;
      }>;
    };
  };
  insert(rows: Array<ContactFormData & { event_id: string; organisation_id: string }>): {
    select(): { single(): SingleResult<Contact> };
  };
  update(payload: ContactFormData): {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        select(): { single(): SingleResult<Contact> };
      };
    };
  };
  delete(): {
    eq(column: string, value: string): {
      eq(column: string, value: string): Promise<{ error: SupabaseError | null }>;
    };
  };
}

export function contactsTable(client: RBACSupabaseClient): ContactsTableClient {
  return client.from('trac_contacts') as ContactsTableClient;
}
