import { useMemo } from 'react';
import { Alert, Card, DataTable, type DataTableColumn } from '@solvera/pace-core/components';
import { parseContactFormData } from '@/features/contacts/contact-schema';
import { useContacts } from '@/features/contacts/hooks/use-contacts';
import type { Contact, ContactFormData } from '@/features/contacts/types';

function toFormInput(data: Partial<Contact>): ContactFormData {
  return parseContactFormData({
    first_name: data.first_name ?? '',
    surname: data.surname ?? '',
    role: data.role ?? undefined,
    phone_number: data.phone_number ?? undefined,
    email_address: data.email_address ?? undefined,
  });
}

export function ContactsContent() {
  const { contacts, isLoading, error, refreshContacts, addContact, updateContact, deleteContact } =
    useContacts();

  const handleCreateRow = async (data: Partial<Contact>) => {
    const contactData = toFormInput(data);
    await addContact(contactData);
    await refreshContacts();
  };

  const handleEditRow = async (row: Contact, data: Partial<Contact>) => {
    const contactData = toFormInput({
      first_name: data.first_name ?? row.first_name,
      surname: data.surname ?? row.surname,
      role: data.role ?? row.role ?? undefined,
      phone_number: data.phone_number ?? row.phone_number ?? undefined,
      email_address: data.email_address ?? row.email_address ?? undefined,
    });
    await updateContact(row.id, contactData);
    await refreshContacts();
  };

  const handleDeleteRow = async (row: Contact) => {
    await deleteContact(row.id);
    await refreshContacts();
  };

  const columns: DataTableColumn<Contact>[] = useMemo(
    () => [
      {
        accessorKey: 'first_name',
        header: 'First Name',
        sortable: true,
        searchable: true,
        fieldType: 'text',
      },
      {
        accessorKey: 'surname',
        header: 'Surname',
        sortable: true,
        searchable: true,
        fieldType: 'text',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        sortable: true,
        searchable: true,
        fieldType: 'text',
      },
      {
        accessorKey: 'phone_number',
        header: 'Phone',
        sortable: true,
        searchable: true,
        fieldType: 'text',
      },
      {
        accessorKey: 'email_address',
        header: 'Email',
        sortable: true,
        searchable: true,
        fieldType: 'text',
      },
    ],
    []
  );

  return (
    <main>
      <section>
        <h1>Contacts</h1>
        <p>
          Manage key contacts for this event, including emergency contacts, tour guides, and
          accommodation providers.
        </p>
        {error != null ? (
          <Alert variant="destructive" role="alert">
            <p>{error}</p>
          </Alert>
        ) : null}
        {!isLoading && error == null && contacts.length === 0 ? (
          <p>No contacts yet for this event. Use Create in the table below to add one.</p>
        ) : null}
        <Card>
          <DataTable
            data={contacts}
            columns={columns}
            rbac={{ pageName: 'contacts' }}
            features={{
              search: true,
              pagination: true,
              sorting: true,
              creation: true,
              editing: true,
              deletion: true,
            }}
            onCreateRow={handleCreateRow}
            onEditRow={handleEditRow}
            onDeleteRow={handleDeleteRow}
            isLoading={isLoading}
            getRowId={(row) => String((row as Contact).id)}
          />
        </Card>
      </section>
    </main>
  );
}
