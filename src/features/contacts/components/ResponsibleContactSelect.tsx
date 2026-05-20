import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@solvera/pace-core/components';
import { useTracContactsPicker } from '@/features/contacts/hooks/use-trac-contacts-picker';

export interface ResponsibleContactSelectProps {
  value: string | null | undefined;
  onValueChange: (contactId: string | null) => void;
  disabled?: boolean;
}

function formatContactLabel(contact: {
  first_name: string;
  surname: string;
  role: string | null;
}): string {
  const name = `${contact.first_name} ${contact.surname}`.trim();
  if (contact.role != null && contact.role !== '') {
    return `${name} (${contact.role})`;
  }
  return name;
}

/** SLICE-09: select `trac_risks.responsible_contact_id` from SLICE-06 contacts. */
export function ResponsibleContactSelect({
  value,
  onValueChange,
  disabled = false,
}: ResponsibleContactSelectProps) {
  const { contacts, isLoading, error } = useTracContactsPicker();

  if (error != null) {
    return (
      <output role="status">
        <p>Could not load contacts for this risk.</p>
      </output>
    );
  }

  return (
    <Label htmlFor="responsible-contact">
      Responsible contact
      <Select
        value={value ?? null}
        onValueChange={onValueChange}
      >
        <SelectTrigger
          disabled={disabled || isLoading}
          placeholder={isLoading ? 'Loading contacts…' : 'Select a contact'}
        >
          <SelectValue placeholder={isLoading ? 'Loading contacts…' : 'Select a contact'} />
        </SelectTrigger>
        <SelectContent>
          {contacts.map((contact) => (
            <SelectItem key={contact.id} value={contact.id}>
              {formatContactLabel(contact)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
}
