import { useContacts } from '@/features/contacts/hooks/use-contacts';
import type { Contact } from '@/features/contacts/types';
import { MasterPlanSectionShell } from '@/features/master-plan/components/MasterPlanSectionShell';

function formatContactLine(contact: Contact): string {
  const name = [contact.first_name, contact.surname].filter(Boolean).join(' ');
  const parts = [name];
  if (contact.role?.trim()) parts.push(contact.role.trim());
  if (contact.phone_number?.trim()) parts.push(contact.phone_number.trim());
  if (contact.email_address?.trim()) parts.push(contact.email_address.trim());
  return parts.join(' · ');
}

export function MasterPlanContactsList() {
  const { contacts, isLoading, error } = useContacts();

  const errorMessage = error;

  return (
    <MasterPlanSectionShell
      title="Contacts"
      isLoading={isLoading}
      isError={error != null}
      error={errorMessage}
      className="break-after-page"
    >
      {contacts.length === 0 ? (
        <p>No contacts recorded for this event yet.</p>
      ) : (
        <ul>
          {contacts.map((contact) => (
            <li key={contact.id}>{formatContactLine(contact)}</li>
          ))}
        </ul>
      )}
    </MasterPlanSectionShell>
  );
}
