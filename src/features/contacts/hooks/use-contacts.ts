import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvents } from '@solvera/pace-core/hooks';
import { useResourcePermissions, useSecureSupabase } from '@solvera/pace-core/rbac';
import type { Contact, ContactFormData } from '@/features/contacts/types';
import { invalidateContactsAndRiskPickers, tracContactsQueryKey } from '@/features/contacts/contact-query-keys';
import { contactsTable } from '@/features/contacts/supabase-contacts-client';

const CONTACTS_PAGE = 'contacts';

function mapForeignKeyDeleteError(error: { code?: string; message?: string }): Error {
  if (error.code === '23503') {
    return new Error(
      'This contact is linked to one or more risks. Reassign or remove those links before deleting.'
    );
  }
  return new Error(error.message ?? 'Failed to delete contact');
}

export function useContacts() {
  const { selectedEvent, isLoading: eventLoading } = useEvents();
  const secureSupabase = useSecureSupabase();
  const {
    canCreate,
    canUpdate,
    canDelete,
    isLoading: permissionsLoading,
  } = useResourcePermissions(CONTACTS_PAGE);
  const queryClient = useQueryClient();

  const eventId = selectedEvent?.id;
  const organisationId = selectedEvent?.organisation_id;
  const contactsQueryKey = eventId != null ? tracContactsQueryKey(eventId) : ['trac-contacts', 'none'];

  const {
    data: contacts = [],
    isLoading,
    error: queryError,
    refetch: refetchContacts,
  } = useQuery<Contact[]>({
    queryKey: contactsQueryKey,
    queryFn: async () => {
      if (eventId == null) {
        return [];
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { data, error } = await contactsTable(secureSupabase)
        .select('*')
        .eq('event_id', eventId)
        .order('first_name', { ascending: true });

      if (error != null) {
        throw new Error(error.message);
      }

      return (data ?? []) as Contact[];
    },
    enabled: eventId != null && !eventLoading && secureSupabase != null,
    staleTime: 30_000,
    retry: 1,
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactData: ContactFormData): Promise<Contact> => {
      if (eventId == null) {
        throw new Error('No event selected');
      }
      if (organisationId == null || organisationId === '') {
        throw new Error('No organisation context available');
      }
      if (permissionsLoading) {
        throw new Error('Permission check in progress. Please wait…');
      }
      if (!canCreate) {
        throw new Error('Permission denied: You do not have permission to create contacts.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { data, error } = await contactsTable(secureSupabase)
        .insert([
          {
            ...contactData,
            event_id: eventId,
            organisation_id: organisationId,
          },
        ])
        .select()
        .single();

      if (error != null) {
        throw new Error(error.message);
      }

      return data as Contact;
    },
    onSuccess: () => {
      if (eventId != null) {
        invalidateContactsAndRiskPickers(queryClient, eventId);
      }
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({
      id,
      contactData,
    }: {
      id: string;
      contactData: ContactFormData;
    }): Promise<Contact> => {
      if (eventId == null) {
        throw new Error('No event selected');
      }
      if (!canUpdate) {
        throw new Error('Permission denied: You do not have permission to update contacts.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { data, error } = await contactsTable(secureSupabase)
        .update(contactData)
        .eq('id', id)
        .eq('event_id', eventId)
        .select()
        .single();

      if (error != null) {
        throw new Error(error.message);
      }

      return data as Contact;
    },
    onSuccess: () => {
      if (eventId != null) {
        invalidateContactsAndRiskPickers(queryClient, eventId);
      }
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (eventId == null) {
        throw new Error('No event selected');
      }
      if (!canDelete) {
        throw new Error('Permission denied: You do not have permission to delete contacts.');
      }
      if (secureSupabase == null) {
        throw new Error('Secure Supabase client not available');
      }

      const { error } = await contactsTable(secureSupabase)
        .delete()
        .eq('id', id)
        .eq('event_id', eventId);

      if (error != null) {
        throw mapForeignKeyDeleteError(error);
      }
    },
    onSuccess: () => {
      if (eventId != null) {
        invalidateContactsAndRiskPickers(queryClient, eventId);
      }
    },
  });

  const addContact = useCallback(
    async (contactData: ContactFormData): Promise<Contact> => addContactMutation.mutateAsync(contactData),
    [addContactMutation]
  );

  const updateContact = useCallback(
    async (id: string, contactData: ContactFormData): Promise<Contact> =>
      updateContactMutation.mutateAsync({ id, contactData }),
    [updateContactMutation]
  );

  const deleteContact = useCallback(
    async (id: string): Promise<void> => deleteContactMutation.mutateAsync(id),
    [deleteContactMutation]
  );

  return {
    contacts,
    isLoading,
    error:
      queryError instanceof Error
        ? queryError.message
        : queryError != null
          ? String(queryError)
          : null,
    refreshContacts: refetchContacts,
    addContact,
    updateContact,
    deleteContact,
  };
}
