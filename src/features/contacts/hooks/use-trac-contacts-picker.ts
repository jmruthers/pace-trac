import { useContacts } from '@/features/contacts/hooks/use-contacts';
import type { Contact } from '@/features/contacts/types';

/**
 * SLICE-09 consumer hook: same cache as `/contacts` via `useContacts` / `tracContactsQueryKey`.
 * Risk forms should use this (or `useContacts`) for `responsible_contact_id` pickers.
 */
export function useTracContactsPicker(): {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
} {
  const { contacts, isLoading, error } = useContacts();
  return { contacts, isLoading, error };
}
