import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { parseContactFormData } from '@/features/contacts/contact-schema';
import { ContactsContent } from '@/features/contacts/ContactsContent';

const mockUseContacts = vi.fn();

vi.mock('@/features/contacts/hooks/use-contacts', () => ({
  useContacts: () => mockUseContacts(),
}));

let capturedOnCreateRow: ((row: Record<string, unknown>) => void | Promise<void>) | undefined;

vi.mock('@solvera/pace-core/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solvera/pace-core/components')>();
  return {
    ...actual,
    DataTable: ({
      onCreateRow,
      data,
    }: {
      onCreateRow?: (row: Record<string, unknown>) => void | Promise<void>;
      data: unknown[];
    }) => {
      capturedOnCreateRow = onCreateRow;
      return (
        <section>
          <button
            type="button"
            onClick={() => void onCreateRow?.({ first_name: '', surname: 'Test' })}
          >
            Simulate create
          </button>
          <ul>
            {(data as Array<{ first_name: string }>).map((row) => (
              <li key={row.first_name}>{row.first_name}</li>
            ))}
          </ul>
        </section>
      );
    },
    Alert: ({ children }: { children: React.ReactNode }) => <div role="alert">{children}</div>,
    Card: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  };
});

describe('ContactsContent validation (G3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnCreateRow = undefined;
    mockUseContacts.mockReturnValue({
      contacts: [],
      isLoading: false,
      error: null,
      refreshContacts: vi.fn(),
      addContact: vi.fn(),
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
    });
  });

  it('blocks create when required first name is missing', async () => {
    const addContact = vi.fn();
    mockUseContacts.mockReturnValue({
      contacts: [],
      isLoading: false,
      error: null,
      refreshContacts: vi.fn(),
      addContact,
      updateContact: vi.fn(),
      deleteContact: vi.fn(),
    });

    render(<ContactsContent />);

    expect(capturedOnCreateRow).toBeDefined();

    await expect(capturedOnCreateRow!({ first_name: '', surname: 'Test' })).rejects.toThrow(
      /First name is required/i
    );
    expect(addContact).not.toHaveBeenCalled();
  });

  it('uses the same validation as parseContactFormData on create', async () => {
    expect(() => parseContactFormData({ first_name: '', surname: 'Test' })).toThrow(
      /First name is required/i
    );
  });
});
