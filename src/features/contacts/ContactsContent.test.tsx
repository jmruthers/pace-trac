import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactsContent } from '@/features/contacts/ContactsContent';
import type { Contact } from '@/features/contacts/types';

const mockUseContacts = vi.fn();

vi.mock('@/features/contacts/hooks/use-contacts', () => ({
  useContacts: () => mockUseContacts(),
}));

vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  return {
    ...actual,
    DataTable: ({ data }: { data: Array<{ first_name: string; surname: string }> }) => (
      <table>
        <tbody>
          {data.map((row) => (
            <tr key={`${row.first_name}-${row.surname}`}>
              <td>{row.first_name}</td>
              <td>{row.surname}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    Alert: ({ children }: { children: ReactNode }) => <div role="alert">{children}</div>,
    Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  };
});

const sampleContact: Contact = {
  id: 'contact-1',
  event_id: 'event-1',
  organisation_id: 'org-1',
  first_name: 'Jane',
  surname: 'Planner',
  role: 'Guide',
  phone_number: '0400000000',
  email_address: 'jane@example.com',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  created_by: null,
  updated_by: null,
};

describe('ContactsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContacts.mockReturnValue({
      contacts: [sampleContact],
      isLoading: false,
      error: null,
      refreshContacts: vi.fn(),
      addContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
    });
  });

  it('renders heading and contact list data', () => {
    render(<ContactsContent />);
    expect(screen.getByRole('heading', { name: 'Contacts' })).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Planner')).toBeInTheDocument();
  });

  it('shows empty guidance when there are no contacts', () => {
    mockUseContacts.mockReturnValue({
      contacts: [],
      isLoading: false,
      error: null,
      refreshContacts: vi.fn(),
      addContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
    });

    render(<ContactsContent />);
    expect(screen.getByText(/No contacts yet for this event/i)).toBeInTheDocument();
  });

  it('shows error alert when list query fails', () => {
    mockUseContacts.mockReturnValue({
      contacts: [],
      isLoading: false,
      error: 'Could not load contacts',
      refreshContacts: vi.fn(),
      addContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
    });

    render(<ContactsContent />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load contacts');
  });
});
